import { NextRequest } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/utils/supabase/instance";
import { openAIRateLimiter } from "@/utils/rateLimiter";
import { calculateWordCredits } from "@/utils/wordCounter";
import { checkWordCredits, deductWordCredits } from "@/lib/wordCredit";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Optimize prompts to be more concise
const ANALYSIS_PROMPTS = {
  summary: "Summarize this text concisely, focusing on key points.",
  keyPoints: "List the main points as bullet points.",
  topics: "List main topics, one per line.",
  flashcards: `Return a JSON array of flashcards. Format: [{"question": string, "answer": string}]`,
  quiz: `Return a JSON array of quiz items. Format: [{"question": string, "options": string[], "answer": string}]`,
};

// Optimize chunk size based on analysis type
const CHUNK_SIZES = {
  summary: 3000,
  keyPoints: 2000,
  topics: 4000,
  flashcards: 2000,
  quiz: 2000,
};

function getSystemPrompt(type: string) {
  return ANALYSIS_PROMPTS[type as keyof typeof ANALYSIS_PROMPTS] || "";
}

function splitIntoChunks(text: string, maxLength: number): string[] {
  // Split on paragraph boundaries when possible
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const paragraph of paragraphs) {
    if (currentLength + paragraph.length > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk.join("\n\n"));
      currentChunk = [paragraph];
      currentLength = paragraph.length;
    } else {
      currentChunk.push(paragraph);
      currentLength += paragraph.length;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n\n"));
  }

  return chunks;
}

async function processChunkWithRetry(
  chunk: string,
  type: string,
  retries = 3
): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await openAIRateLimiter.add(async () => {
        const response = await client.chat.completions.create({
          model: attempt === 1 ? "gpt-3.5-turbo" : "gpt-4", // Start with cheaper model
          messages: [
            {
              role: "system",
              content: getSystemPrompt(type),
            },
            {
              role: "user",
              content: chunk,
            },
          ],
          temperature: 0.7,
        });
        return response.choices[0]?.message?.content || "";
      });
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (
        attempt === retries ||
        (error.code !== "rate_limit_exceeded" && error.code !== 429)
      ) {
        throw error;
      }
      // Wait before retry, with exponential backoff
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
  throw new Error("Failed after multiple retries");
}

export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response("Authorization header missing or invalid", { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response("Unauthorized, invalid token", { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const { content, type } = body;

    if (!content || typeof content !== "string") {
      return new Response(JSON.stringify({ error: "Content is required and must be a string" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!type || !ANALYSIS_PROMPTS[type as keyof typeof ANALYSIS_PROMPTS]) {
      return new Response(JSON.stringify({ 
        error: "Invalid analysis type",
        validTypes: Object.keys(ANALYSIS_PROMPTS),
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check word credits before processing
    const remainingCredits = await checkWordCredits(user.user.id);
    
    // Estimate token usage
    const estimatedTokens = Math.ceil(content.length / 4);
    const estimatedResponseTokens = 1000; // Typical response length
    const estimatedTotalCredits = calculateWordCredits(estimatedTokens, estimatedResponseTokens);

    if (remainingCredits < estimatedTotalCredits) {
      return new Response(
        JSON.stringify({ error: "Insufficient word credits" }),
        { status: 402 }
      );
    }

    // Get appropriate chunk size for analysis type
    const chunkSize = CHUNK_SIZES[type as keyof typeof CHUNK_SIZES] || 2000;
    const chunks = splitIntoChunks(content, chunkSize);

    // Process chunks sequentially to avoid rate limits
    const chunkResults = [];
    for (const chunk of chunks) {
      const result = await processChunkWithRetry(chunk, type);
      chunkResults.push(result);
    }

    let finalResult;

    switch (type) {
      case "flashcards":
      case "quiz": {
        const cleanedResults = chunkResults.map(result => {
          try {
            // Remove any markdown code block syntax and clean up the JSON string
            const cleaned = result
              .replace(/```json\n|\n```|```/g, "")
              .replace(/\n\s*/g, " ")  // Replace newlines and extra spaces with single space
              .trim();
            
            // Ensure the string is a valid JSON array
            if (!cleaned.startsWith("[") || !cleaned.endsWith("]")) {
              throw new Error("Invalid JSON array format");
            }
            
            const parsed = JSON.parse(cleaned);
            if (!Array.isArray(parsed)) {
              throw new Error("Parsed result is not an array");
            }
            
            return parsed;
          } catch (error) {
            console.error("JSON parse error:", error, "Raw result:", result);
            return []; // Return empty array for invalid JSON
          }
        });

        finalResult = {
          [type]: cleanedResults.flat().filter(item => 
            item && 
            typeof item === "object" && 
            typeof item.question === "string" && 
            (type === "flashcards" ? 
              typeof item.answer === "string" : 
              Array.isArray(item.options) && typeof item.answer === "string")
          ),
        };
        break;
      }
      case "summary": {
        if (chunks.length > 1) {
          // For multiple chunks, combine summaries and generate a final summary
          const combinedSummary = await processChunkWithRetry(
            chunkResults.join("\n\n"),
            "summary"
          );
          finalResult = { summary: combinedSummary };
        } else {
          finalResult = { summary: chunkResults[0] };
        }
        break;
      }
      case "keyPoints":
      case "topics": {
        const combined = chunkResults
          .join("\n")
          .split("\n")
          .map(item => item.trim())
          .filter(Boolean)
          .filter(item => item.startsWith("-") || item.startsWith("•"))
          .map(item => item.replace(/^[-•]\s*/, "")); // Remove bullet points
        
        finalResult = {
          [type]: [...new Set(combined)], // Remove duplicates
        };
        break;
      }
      default: {
        finalResult = { [type]: chunkResults[0] };
      }
    }

    // Calculate actual token usage and deduct credits
    const actualTokens = Math.ceil(content.length / 4);
    const actualResponseTokens = chunkResults.reduce((acc, result) => acc + result.length, 0);
    const actualCredits = calculateWordCredits(actualTokens, actualResponseTokens);

    await deductWordCredits(user.user.id, actualCredits);

    return new Response(JSON.stringify({
      ...finalResult,
      remainingCredits: remainingCredits - actualCredits
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in PDF analysis:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred during PDF analysis",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
      {
        status: error.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

const questions = [
  {
    "question": "What is an irrational number?",
    "options": ["A number that can be expressed as a fraction", "A number with an infinitely repeating decimal pattern", "A negative number", "A whole number"],
    "answer": "A number with an infinitely repeating decimal pattern"
  },
  {
    "question": "What is the most famous irrational number?",
    "options": ["π (pi)", "2", "0.5", "10"],
    "answer": "π (pi)"
  },
  {
    "question": "What is a real number?",
    "options": ["A whole number", "A number that can be expressed as a single decimal", "An odd number", "A positive number"],
    "answer": "A number that can be expressed as a single decimal"
  },
  {
    "question": "Identify the categories that the number 8 belongs to.",
    "options": ["Even, composite, natural, whole, integer, rational, real", "Odd, prime, irrational", "Positive, whole, irrational", "Negative, even, rational"],
    "answer": "Even, composite, natural, whole, integer, rational, real"
  },
  {
    "question": "Is every integer a rational number?",
    "options": ["Yes", "No", "Only prime integers are rational", "Only negative integers are rational"],
    "answer": "Yes"
  }
];
