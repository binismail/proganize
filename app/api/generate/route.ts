import { NextResponse } from "next/server";
import OpenAI from "openai";
import { checkAndInitializeUser } from "@/utils/supabaseOperations";
import { supabase } from "@/utils/supabase/instance";
import { calculateWordCredits } from "@/utils/wordCounter";
import { checkWordCredits, deductWordCredits } from "@/lib/wordCredit";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1] || "";  
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header missing" }),
        { status: 401 }
      );
    }

    // Verify the token with Supabase
    const { data: user, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized, invalid token" }),
        { status: 401 }
      );
    }

    const { prompt, template, values } = await req.json();

    // Check word credits before processing
    const remainingCredits = await checkWordCredits(user.user.id);
    
    // Get the system message based on the template
    const systemMessage = getSystemMessage(template);

    // Estimate token usage
    const estimatedTokens = Math.ceil((systemMessage.length + prompt.length) / 4);
    const estimatedResponseTokens = 2000; // max_tokens parameter
    const estimatedTotalCredits = calculateWordCredits(estimatedTokens, estimatedResponseTokens);

    if (remainingCredits < estimatedTotalCredits) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient word credits. Please upgrade your plan to continue.",
          type: "INSUFFICIENT_CREDITS"
        }),
        { status: 402 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: `${systemMessage}

Important Response Format:
1. Start with "### Initial Title: [Brief title based on content]"
2. Then include document content between "### Generated Document" and "### End of Generated Document"
3. Document content must:
   - Use proper markdown formatting
   - Include clear section headings
   - Be detailed and comprehensive
   - Follow template structure when provided
4. End with any additional notes or suggestions`
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error("No response from OpenAI");
    }

    // Calculate actual token usage and deduct credits
    const actualCredits = calculateWordCredits(
      completion.usage?.prompt_tokens || estimatedTokens,
      completion.usage?.completion_tokens || estimatedResponseTokens
    );

    await deductWordCredits(user.user.id, actualCredits);

    // Format the content based on the template
    const formattedContent = formatContent(completion.choices[0].message.content, template);

    return NextResponse.json({ 
      content: formattedContent,
      remainingCredits: remainingCredits - actualCredits
    });
  } catch (error: any) {
    console.error("Error generating content:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to generate content",
        type: error.type || "GENERATION_ERROR"
      }),
      { status: 500 }
    );
  }
}

function getSystemMessage(template: string | null): string {
  if (!template) return "You are a professional content creator. Write high-quality, engaging content that serves the user's purpose.";

  switch (template) {
    case "linkedin-post":
      return `You are an expert LinkedIn content creator. Your task is to write engaging, professional LinkedIn posts that drive engagement. 
      Focus on:
      - Strong hooks that capture attention
      - Professional yet conversational tone
      - Strategic use of line breaks and emojis
      - Clear call-to-actions
      - Relevant hashtags`;

    case "tweet-thread":
      return `You are a Twitter growth expert. Your task is to create viral Twitter threads that provide value and drive engagement.
      Focus on:
      - Attention-grabbing first tweet
      - Short, punchy sentences
      - Use of emojis and bullet points
      - Building curiosity between tweets
      - Strong closing with call-to-action`;

    case "blog-post":
      return `You are an SEO content expert. Your task is to write blog posts that rank well in search engines while providing value to readers.
      Focus on:
      - SEO-optimized headings and structure
      - Natural keyword integration
      - Engaging introduction
      - Comprehensive coverage
      - Clear takeaways`;

    default:
      return `You are a professional content creator. Write high-quality, engaging content that serves the user's purpose.
      Focus on:
      - Clear and concise writing
      - Proper structure and formatting
      - Engaging and valuable content
      - Professional tone
      - Actionable insights`;
  }
}

function formatContent(content: string | null, template: string | null): string {
  if (!content) return "";
  if (!template) return content;
  
  switch (template) {
    case "linkedin-post":
    case "tweet-thread":
      // Add line breaks and emojis
      return content.replace(/\n/g, "\n\n");

    case "blog-post":
      // Add HTML formatting
      return content
        .replace(/# (.*)/g, "<h1>$1</h1>")
        .replace(/## (.*)/g, "<h2>$1</h2>")
        .replace(/\n/g, "</p><p>");

    default:
      return content;
  }
}
