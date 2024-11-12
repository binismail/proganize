import { supabase } from "@/utils/supabase/instance";
import { NextRequest } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function trimConversation(conversation: any[], maxChars: number): any[] {
  let totalChars = JSON.stringify(conversation).length;
  while (totalChars > maxChars && conversation.length > 0) {
    conversation.shift(); // Remove the oldest message
    totalChars = JSON.stringify(conversation).length;
  }
  return conversation;
}

export async function POST(req: NextRequest) {
  const { conversation, documentType, template, referenceDocument } = await req
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

  // Trim the conversation to not exceed 10,000 characters
  const trimmedConversation = trimConversation(conversation, 10000);

  // Create a context-aware system prompt
  const systemPrompt =
    `You are an intelligent AI assistant helping users create professional documentation. ${
      documentType
        ? `You are specifically focused on creating ${documentType} documentation${
          template ? ` using the "${template}" template` : ""
        }.`
        : "You will help create well-structured documentation based on the user's needs."
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
    }

Important Guidelines:
1. Always provide comprehensive, well-structured documentation
2. Include all necessary sections and details
3. Use clear headings and organization
4. Maintain professional tone and clarity

Important Response Format:
1. For the first message in a conversation:
   - Start with "### Initial Title: [Brief title based on user's request]"
   - Then provide your conversational response
   - Do not generate full document content yet

2. For subsequent messages:
   - If generating final document, include "### Document Title: [Refined title]"
   - Then include document content between "### Generated Document" and "### End of Generated Document"
   - Follow with conversational response

3. Document content must:
   - Start with "### Generated Document"
   - End with "### End of Generated Document"
   - Include clear section headings
   - Use proper markdown formatting
   - Be detailed and comprehensive
   - Follow industry best practices${
      documentType ? ` for ${documentType} documentation` : ""
    }

3. Conversational responses should:
   - Be natural and helpful
   - Guide users to provide necessary information
   - Ask for clarification on missing details
   - Suggest improvements or additional sections
   - Not contain markdown formatting

Document Structure Guidelines:
- Always include an introduction/overview section
- Break content into logical sections with clear headings
- Include examples where appropriate
- Add placeholders for missing critical information
- End with next steps or action items${
      documentType === "technical-spec"
        ? `
Additional Technical Spec Guidelines:
- Include system architecture details
- List technical requirements
- Specify dependencies and constraints
- Document API endpoints or interfaces
- Include security considerations`
        : documentType === "user-stories"
        ? `
Additional User Story Guidelines:
- Use standard user story format
- Include acceptance criteria
- Specify user personas
- Detail expected behavior
- List edge cases and exceptions`
        : documentType === "product-insights"
        ? `
Additional PRD Guidelines:
- Include market analysis
- Define success metrics
- List feature requirements
- Specify user flows
- Document constraints and limitations`
        : ""
    }

Example Response Structure:
---
I understand you're looking to create ${
      documentType || "a document"
    }. Let me help structure this properly. Could you provide more details about...

### Document Title: [Generated Title]
### Generated Document
# [Document Title]

## Overview
[Comprehensive introduction]

## [Main Section]
[Detailed content]

## Next Steps
[Action items or follow-up tasks]
### End of Generated Document
---`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...trimmedConversation,
      ],
    });

    if (
      response.choices && response.choices[0] &&
      response.choices[0].message
    ) {
      return new Response(
        JSON.stringify({ reply: response.choices[0].message.content }),
      );
    } else {
      throw new Error("Unexpected response structure from OpenAI API");
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error
          ? error.message
          : "An unknown error occurred",
      }),
      { status: 500 },
    );
  }
}
