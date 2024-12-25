import { supabase } from "@/utils/supabase/instance";
import { NextRequest } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function trimConversation(conversation: any[], maxChars: number): any[] {
  if (!conversation || !Array.isArray(conversation)) return [];
  
  let totalChars = JSON.stringify(conversation).length;
  while (totalChars > maxChars && conversation.length > 0) {
    conversation.shift(); // Remove the oldest message
    totalChars = JSON.stringify(conversation).length;
  }
  return conversation;
}

export async function POST(req: NextRequest) {
  const { messages, conversation, documentType, template, templateContext, referenceDocument } = await req
    .json();

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!authHeader) {
    return new Response(
      "Authorization header missing",
      { status: 401 },
    );
  }

  // Verify the token with Supabase
  const { data: user, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return new Response(
      "Unauthorized, invalid token",
      { status: 401 },
    );
  }

  try {
    // Handle both messages (from AI editor) and conversation (from document generator)
    const messageArray = messages || conversation || [];
    const trimmedMessages = trimConversation(messageArray, 10000);

    // Create a context-aware system prompt for document generation
    const systemPrompt = documentType ? 
      `You are an intelligent AI assistant helping users create professional documentation. ${
        documentType
          ? `You are specifically focused on creating ${documentType} documentation${
            template ? ` using the "${template}" template` : ""
          }.`
          : "You will help create well-structured documentation based on the user's needs."
      }

      ${
        templateContext ? `
      Template Information:
      ${templateContext}

      Please follow the template structure and guidelines provided above. Ensure your response adheres to the specified format and includes all required sections.
      ` : ""
      }

      ${
        referenceDocument
          ? `
      Reference Document Content:
      \`\`\`
      ${referenceDocument}
      \`\`\`

      Please use the above reference document content to inform and enhance your responses. When relevant, incorporate insights from this document while maintaining the requested document structure.
      `
          : ""
      }` : undefined;

    const completion = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        ...trimmedMessages
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return new Response(
      JSON.stringify({
        content: completion.choices[0].message.content,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("OpenAI API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate content" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
