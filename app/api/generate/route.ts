import { NextResponse } from "next/server";
import OpenAI from "openai";
import { checkAndInitializeUser } from "@/utils/supabaseOperations";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check user credits
    const { credits } = await checkAndInitializeUser(user.id, user);
    if (credits.remaining_credits <= 0) {
      return NextResponse.json(
        { error: "No credits remaining" },
        { status: 402 }
      );
    }

    const { prompt, template, values } = await req.json();

    // Get the system message based on the template
    const systemMessage = getSystemMessage(template);

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0].message.content;

    // Format the content based on the template
    const formattedContent = formatContent(content, template);

    return NextResponse.json({ content: formattedContent });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

function getSystemMessage(template: string): string {
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
      - Comprehensive coverage of the topic
      - Clear takeaways and next steps`;

    case "facebook-ad":
      return `You are a Facebook advertising expert. Your task is to write compelling ad copy that drives conversions.
      Focus on:
      - Attention-grabbing headlines
      - Clear value proposition
      - Emotional triggers
      - Social proof
      - Strong call-to-actions`;

    case "video-script":
      return `You are a video script expert. Your task is to write engaging scripts that keep viewers watching.
      Focus on:
      - Hook in first 5 seconds
      - Conversational tone
      - Clear structure and flow
      - Visual descriptions
      - Engaging closing`;

    default:
      return "You are a professional content creator. Write high-quality, engaging content that serves the user's purpose.";
  }
}

function formatContent(content: string, template: string): string {
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
