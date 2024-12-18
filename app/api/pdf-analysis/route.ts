import { NextRequest } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/utils/supabase/instance";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ANALYSIS_PROMPTS = {
  summary: "Generate a concise summary of the following text. Focus on the main ideas and key takeaways.",
  keyPoints: "Extract the key points from the following text. Format as a bullet-point list.",
  topics: "Identify the main topics and themes discussed in the following text. Return as a simple array of topics.",
  toc: "Generate a table of contents for the following text. Include section titles and estimated page numbers.",
  flashcards: `Generate study flashcards from the following text. Return a JSON array of objects with 'question' and 'answer' properties.
Example format:
[
  {
    "question": "What is...",
    "answer": "It is..."
  }
]
Do not include markdown formatting or code blocks in the response.`,
  quiz: `Generate multiple choice quiz questions from the following text. Return a JSON array of objects with 'question', 'options' (array), and 'answer' properties.
Example format:
[
  {
    "question": "What is...",
    "options": ["A...", "B...", "C...", "D..."],
    "answer": "A..."
  }
]
Do not include markdown formatting or code blocks in the response.`,
};

function getSystemPrompt(type: string) {
  return ANALYSIS_PROMPTS[type as keyof typeof ANALYSIS_PROMPTS];
}

function splitIntoChunks(text: string, maxLength: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (const word of words) {
    if (currentChunk.join(" ").length + word.length > maxLength) {
      chunks.push(currentChunk.join(" "));
      currentChunk = [word];
    } else {
      currentChunk.push(word);
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!authHeader) {
      return new Response("Authorization header missing", { status: 401 });
    }

    // Verify the token with Supabase
    const { data: user, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return new Response("Unauthorized, invalid token", { status: 401 });
    }

    const { content, type } = await req.json();

    if (!content || !type || !ANALYSIS_PROMPTS[type as keyof typeof ANALYSIS_PROMPTS]) {
      return new Response("Invalid request parameters", { status: 400 });
    }

    const chunks = splitIntoChunks(content, 2000);

    // Add delay function
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    let finalResult;

    // Process chunks with delay between each
    const chunkResults = await Promise.all(
      chunks.map(async (chunk, index) => {
        // Add delay between chunks to avoid rate limits
        if (index > 0) {
          await delay(2000); // 2 second delay between chunks
        }

        try {
          const response = await client.chat.completions.create({
            model: "gpt-4o",
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
        } catch (error: any) {
          if (error?.code === 'rate_limit_exceeded') {
            // Increased delay for rate limit retry
            await delay(3000); // 3 second delay before retry
            const retryResponse = await client.chat.completions.create({
              model: "gpt-4o",
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
            return retryResponse.choices[0]?.message?.content || "";
          }
          throw error;
        }
      })
    );

    switch (type) {
      case "flashcards":
      case "quiz":
        try {
          // Clean the response of markdown formatting
          const cleanedResults = chunkResults.map(result => {
            // Remove markdown code blocks and any surrounding whitespace
            let cleaned = result.replace(/```json\n|\n```|```/g, '').trim();
            try {
              // Parse the JSON
              return JSON.parse(cleaned);
            } catch (parseError) {
              console.error('JSON parse error:', parseError);
              console.log('Failed to parse:', cleaned);
              throw new Error(`Invalid JSON response: ${parseError.message}`);
            }
          });
          
          // Flatten the results if we have multiple chunks
          finalResult = cleanedResults.flat();
          
          // Validate the response format
          if (!Array.isArray(finalResult)) {
            throw new Error(`Invalid ${type} format: expected array`);
          }
          
          if (type === 'flashcards') {
            finalResult.forEach((card, index) => {
              if (!card.question || !card.answer) {
                throw new Error(`Invalid flashcard at index ${index}: missing question or answer`);
              }
            });
          } else {
            finalResult.forEach((quiz, index) => {
              if (!quiz.question || !Array.isArray(quiz.options) || !quiz.answer) {
                throw new Error(`Invalid quiz question at index ${index}: missing required fields`);
              }
            });
          }
          
          // Wrap in the correct response format
          finalResult = {
            [type]: finalResult
          };
          
          console.log(`Final ${type} result:`, finalResult); // Debug log
        } catch (error) {
          console.error('Error parsing response:', error);
          throw new Error(`Error parsing ${type}: ${error.message}`);
        }
        break;
      case "summary":
        if (chunks.length > 1) {
          // Add delay before combining results for heavy documents
          await delay(2000);
          // Combine summaries into one
          const combinedResponse = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "Combine these summaries into one coherent summary:",
              },
              {
                role: "user",
                content: chunkResults.join("\n\n"),
              },
            ],
          });
          finalResult = { summary: combinedResponse.choices[0]?.message?.content };
        } else {
          finalResult = { summary: chunkResults[0] };
        }
        break;

      case "keyPoints":
        // Combine and deduplicate points
        const points = chunkResults
          .join("\n")
          .split("\n")
          .filter((point) => point.trim())
          .map((point) => point.replace(/^\d+\.\s*/, "").trim());
        finalResult = { keyPoints: Array.from(new Set(points)) };
        break;

      case "topics":
        // Combine and deduplicate topics
        const topics = chunkResults
          .join(",")
          .split(",")
          .map((topic) => topic.trim())
          .filter(Boolean);
        finalResult = { topics: Array.from(new Set(topics)) };
        break;

      case "toc":
        try {
          const toc = JSON.parse(chunkResults[0]);
          finalResult = { toc };
        } catch (error) {
          console.error("Error parsing TOC:", error);
          finalResult = { toc: [] };
        }
        break;

      default:
        return new Response("Invalid analysis type", { status: 400 });
    }

    return new Response(JSON.stringify(finalResult));
  } catch (error) {
    console.error("PDF analysis error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }),
      { status: 500 }
    );
  }
}
