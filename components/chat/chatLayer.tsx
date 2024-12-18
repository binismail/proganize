"use client";

import { useRef, useState, useEffect } from "react";
import { useAppContext } from "@/app/context/appContext";
import { supabase } from "@/utils/supabase/instance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getToken } from "@/utils/supabaseOperations";
import { pdfService } from "@/utils/services/pdfService";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatLayerProps {
  extractedText: string;
}

export default function ChatLayer({ extractedText }: ChatLayerProps) {
  const { state } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.currentPDFConversation) {
      loadConversation(state.currentPDFConversation.id);
    } else {
      // Reset messages when no conversation is selected
      setMessages([]);
      setIsLoading(false);
    }
  }, [state.currentPDFConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = async (conversationId: string) => {
    try {
      setIsLoading(true);
      const { data: messages, error } = await supabase
        .from("pdf_conversation_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (messages && messages.length > 0) {
        setMessages(messages);
      } else {
        setMessages([
          {
            role: "assistant",
            content:
              "I'm ready to help you with this document. What would you like to know?",
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      alert("Failed to load conversation messages");
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || !state.currentPDFConversation) return;

    setIsLoading(true);
    const newMessage: ChatMessage = {
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    };

    try {
      // Add user message to UI immediately
      setMessages((prev) => [...prev, newMessage]);

      // Get the extracted content for context
      const pdfContent = await pdfService.getExtractedContent(
        state.currentPDFConversation.id
      );

      if (!pdfContent?.content) {
        throw new Error(
          "PDF content not found. Please try reloading the page."
        );
      }

      // Prepare the context by taking first 1000 words and last 1000 words
      const words = pdfContent.content.split(/\s+/);
      let contextText = "";

      if (words.length > 2000) {
        const firstPart = words.slice(0, 1000).join(" ");
        const lastPart = words.slice(-1000).join(" ");
        contextText = `${firstPart}\n...[Content truncated for brevity]...\n${lastPart}`;
      } else {
        contextText = pdfContent.content;
      }

      const response = await fetch("/api/pdf-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({
          conversation: messages.concat(newMessage),
          referenceDocument: contextText,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();

      // Add assistant's response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.reply,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save messages to database
      await supabase.from("pdf_conversation_messages").insert([
        {
          conversation_id: state.currentPDFConversation.id,
          role: newMessage.role,
          content: newMessage.content,
          created_at: newMessage.created_at,
        },
        {
          conversation_id: state.currentPDFConversation.id,
          role: assistantMessage.role,
          content: assistantMessage.content,
          created_at: assistantMessage.created_at,
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      alert(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsLoading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className='flex flex-col h-[calc(100vh-4rem)]'>
      {/* Chat Header */}
      <div className='p-4 border-b'>
        <div>
          <h2 className='font-semibold'>
            {state.currentPDFConversation?.title || "No Conversation Selected"}
          </h2>
          {state.currentPDFConversation && (
            <p className='text-sm text-muted-foreground'>
              {state.currentPDFConversation.pdf_name}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto scroll-smooth h-[calc(100vh-12rem)] p-4 space-y-4'>
        {!state.currentPDFConversation ? (
          <div className='flex items-center justify-center h-full text-muted-foreground'>
            Select a conversation or start a new chat
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] break-words ${
                    message.role === "assistant"
                      ? "bg-muted prose prose-sm dark:prose-invert max-w-none"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div
                      className='whitespace-pre-wrap break-words'
                      dangerouslySetInnerHTML={{
                        __html: message.content.replace(/\n/g, "<br/>"),
                      }}
                    />
                  ) : (
                    <p className='whitespace-pre-wrap break-words'>
                      {message.content}
                    </p>
                  )}
                  {message.created_at && (
                    <p className='text-xs mt-1 opacity-70'>
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className='flex justify-start'>
                <div className='bg-muted rounded-lg px-4 py-2 max-w-[80%]'>
                  <div className='flex space-x-2'>
                    <div className='w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.3s]' />
                    <div className='w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.15s]' />
                    <div className='w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce' />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className='p-4 border-t mt-auto'>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const message = inputRef.current?.value || "";
            if (!message.trim()) return;
            sendMessage(message);
          }}
          className='flex gap-2'
        >
          <Input
            ref={inputRef}
            placeholder={
              state.currentPDFConversation
                ? "Type your message..."
                : "Select a conversation to start chatting"
            }
            disabled={!state.currentPDFConversation || isLoading}
          />
          <Button
            type='submit'
            disabled={!state.currentPDFConversation || isLoading}
            variant='default'
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
