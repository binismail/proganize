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
    const { conversation, referenceDocument } = await req.json();

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

    // Trim the conversation to not exceed token limits
    const trimmedConversation = trimConversation(conversation, 10000);

    // Create a context-aware system prompt for PDF analysis
    const systemPrompt =
        `You are an intelligent AI assistant specialized in analyzing and answering questions about PDF documents. 

Reference Document Content:
\`\`\`
${referenceDocument}
\`\`\`

Key Responsibilities:
1. Initial Document Analysis:
   - When first processing a document, provide a comprehensive overview
   - Identify key topics and main points
   - Highlight important sections or findings
   - Suggest potential areas of interest

2. Question Answering:
   - Provide accurate answers based on the document content
   - Quote relevant sections when appropriate
   - Maintain context from previous conversation
   - Admit when information isn't present in the document

3. Response Guidelines:
   - Be concise but thorough
   - Use bullet points for clarity when appropriate
   - Provide page/section references when possible
   - Maintain a helpful and professional tone

Important:
- Only make statements that are supported by the document content
- Clearly indicate when you're making inferences vs stating facts
- If asked about content not in the document, acknowledge this limitation
- Maintain context from the conversation history

Please analyze the document content and respond to queries in a way that demonstrates understanding of the full context while remaining focused on the specific question at hand.`;

    try {
        const response = await client.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                ...trimmedConversation,
            ],
            temperature: 0.7, // Balanced between creativity and accuracy
            max_tokens: 1000, // Adjust based on your needs
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
