"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload } from "lucide-react";
import PDFViewer from "../pdf/pdfViewer";
import { getToken } from "@/utils/supabaseOperations";

export default function ChatPage() {
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([
    {
      role: "assistant",
      content:
        "Hello! I am your document assistant. Upload a PDF to get started, and I can help you analyze it, answer questions, create summaries, or generate quizzes.",
    },
  ]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [outline, setOutline] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleTextExtracted = async (text: string) => {
    setExtractedText((prev) => prev + " " + text);
    // Once text is extracted, send initial processing request
    await processDocument(text);
  };

  const processDocument = async (text: string) => {
    setIsLoading(true);
    const token = await getToken();
    try {
      const response = await fetch("/api/pdf-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversation: [
            {
              role: "user",
              content:
                "Please analyze this document and provide an initial summary.",
            },
          ],
          referenceDocument: text,
        }),
      });

      if (!response.ok) throw new Error("Failed to process document");

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (error) {
      console.error("Document processing error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error processing the document.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOutlineExtracted = (outlineData: any[]) => {
    setOutline(outlineData);
  };

  const renderOutline = (items: any[], level = 0) => {
    return (
      <ul className={`pl-${level * 4}`}>
        {items.map((item, index) => (
          <li key={index}>
            <span className='cursor-pointer hover:text-primary'>
              {item.title}
            </span>
            {item.items &&
              item.items.length > 0 &&
              renderOutline(item.items, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  const handleSendMessage = async () => {
    const userInput = inputRef.current?.value;
    if (!userInput?.trim()) return;

    const userMessage = { role: "user" as const, content: userInput };
    setMessages((prev) => [...prev, userMessage]);

    if (inputRef.current) inputRef.current.value = "";

    setIsLoading(true);
    const token = await getToken();
    try {
      const response = await fetch("/api/pdf-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversation: [...messages, userMessage],
          referenceDocument: extractedText,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: data.reply,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: "Sorry, I encountered an error processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex-1 container grid grid-cols-1 md:grid-cols-[1fr_400px] gap-6 py-6'>
      {/* PDF Viewer */}
      <div className='border rounded-lg p-4'>
        {pdfFile ? (
          <PDFViewer
            file={pdfFile}
            onTextExtracted={handleTextExtracted}
            onOutlineExtracted={handleOutlineExtracted}
          />
        ) : (
          <div className='aspect-[3/4] bg-muted rounded-lg flex items-center justify-center'>
            <Button
              variant='outline'
              className='gap-2'
              onClick={triggerFileUpload}
            >
              <Upload className='h-4 w-4' />
              Upload PDF
            </Button>
            <input
              type='file'
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept='application/pdf'
              className='hidden'
            />
          </div>
        )}
      </div>

      {/* Chat Interface */}
      <Card className='flex flex-col'>
        <Tabs defaultValue='chat' className='flex-1'>
          <TabsList className='w-full justify-start rounded-none border-b bg-transparent p-0'>
            <TabsTrigger
              value='chat'
              className='rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground'
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value='outline'
              className='rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground'
            >
              Outline
            </TabsTrigger>
          </TabsList>
          <TabsContent value='chat' className='flex-1 p-4'>
            <div className='flex flex-col gap-4 h-[calc(100vh-220px)]'>
              <div className='flex-1 overflow-auto'>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className='flex gap-2'>
                <Input
                  ref={inputRef}
                  placeholder='Ask a question about your document...'
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value='outline' className='p-4'>
            {outline.length > 0
              ? renderOutline(outline)
              : "No outline available for this document."}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
