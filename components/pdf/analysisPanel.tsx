"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, BookOpen, ListChecks, FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/utils/supabaseOperations";

interface AnalysisPanelProps {
  pdfContent: string;
}

export function AnalysisPanel({ pdfContent }: AnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState("document");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [showDialog, setShowDialog] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState("");
  const { toast } = useToast();

  const analysisTypes = {
    document: [
      {
        id: "summary",
        title: "Summary",
        description: "Get a concise summary of the document",
        icon: BookOpen,
      },
      {
        id: "keyPoints",
        title: "Key Points",
        description: "Extract main points and insights",
        icon: ListChecks,
      },
      {
        id: "topics",
        title: "Topics",
        description: "Identify main topics and themes",
        icon: FlaskConical,
      },
    ],
    study: [
      {
        id: "flashcards",
        title: "Flashcards",
        description: "Generate study flashcards",
        icon: BookOpen,
      },
      {
        id: "quiz",
        title: "Quiz",
        description: "Create a quiz from the content",
        icon: ListChecks,
      },
    ],
  };

  const handleAnalysis = async (type: string) => {
    try {
      // Validate content
      if (
        !pdfContent ||
        typeof pdfContent !== "string" ||
        pdfContent.trim().length === 0
      ) {
        toast({
          title: "No Content Available",
          description:
            "No PDF content found. Please ensure the PDF has been processed.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading({ ...isLoading, [type]: true });
      const token = await getToken();

      // Log the content and type for debugging
      console.log("Analysis request:", {
        contentType: typeof pdfContent,
        contentLength: pdfContent.length,
        type,
        hasContent: Boolean(pdfContent),
      });

      const response = await fetch("/api/pdf-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: pdfContent,
          type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `Analysis failed: ${response.status}`;
        console.error("Analysis error:", errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data[type]) {
        throw new Error("No analysis results returned");
      }

      setResults({ ...results, [type]: data[type] });
      setActiveAnalysis(type);
      setShowDialog(true);
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description:
          error.message ||
          "There was an error analyzing the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading({ ...isLoading, [type]: false });
    }
  };

  const renderAnalysisResult = (type: string, data: any) => {
    switch (type) {
      case "summary":
        return <p className='whitespace-pre-wrap'>{data}</p>;
      case "keyPoints":
      case "topics":
        return (
          <ul className='list-disc pl-6 space-y-2'>
            {Array.isArray(data) ? (
              data.map((item, i) => <li key={i}>{item}</li>)
            ) : (
              <p>{data}</p>
            )}
          </ul>
        );
      case "flashcards":
        return (
          <div className='space-y-4'>
            {data.map((card: any, i: number) => (
              <Card key={i} className='bg-muted'>
                <CardHeader>
                  <CardTitle className='text-sm'>Question</CardTitle>
                  <CardDescription>{card.question}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className='font-medium'>Answer:</p>
                  <p>{card.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      case "quiz":
        return (
          <div className='space-y-6'>
            {data.map((quiz: any, i: number) => (
              <div key={i} className='space-y-2'>
                <p className='font-medium'>
                  Q{i + 1}: {quiz.question}
                </p>
                <ul className='list-none pl-4 space-y-1'>
                  {quiz.options.map((option: string, j: number) => (
                    <li key={j} className='flex items-center space-x-2'>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border
                        ${option === quiz.answer ? "bg-green-100 border-green-500" : "border-gray-300"}`}
                      >
                        {String.fromCharCode(65 + j)}
                      </div>
                      <span>{option}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      default:
        return <p>No data available</p>;
    }
  };

  return (
    <div className='space-y-4'>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='document'>Document Analysis</TabsTrigger>
          <TabsTrigger value='study'>Study Aids</TabsTrigger>
        </TabsList>

        <TabsContent value='document' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {analysisTypes.document.map((item) => (
              <Card
                key={item.id}
                className='hover:bg-muted/50 transition-colors'
              >
                <CardHeader>
                  <CardTitle className='flex items-center space-x-2'>
                    <item.icon className='w-5 h-5' />
                    <span>{item.title}</span>
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleAnalysis(item.id)}
                    disabled={isLoading[item.id]}
                    className='w-full'
                  >
                    {isLoading[item.id] ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Analyzing...
                      </>
                    ) : (
                      `Generate ${item.title}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='study' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {analysisTypes.study.map((item) => (
              <Card
                key={item.id}
                className='hover:bg-muted/50 transition-colors'
              >
                <CardHeader>
                  <CardTitle className='flex items-center space-x-2'>
                    <item.icon className='w-5 h-5' />
                    <span>{item.title}</span>
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleAnalysis(item.id)}
                    disabled={isLoading[item.id]}
                    className='w-full'
                  >
                    {isLoading[item.id] ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Generating...
                      </>
                    ) : (
                      `Create ${item.title}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className='max-w-2xl max-h-[80vh]'>
          <DialogHeader>
            <DialogTitle>
              {analysisTypes[activeTab as keyof typeof analysisTypes]?.find(
                (item) => item.id === activeAnalysis
              )?.title || "Analysis Results"}
            </DialogTitle>
            <DialogDescription>
              {analysisTypes[activeTab as keyof typeof analysisTypes]?.find(
                (item) => item.id === activeAnalysis
              )?.description || "View your analysis results below"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className='h-full max-h-[60vh] pr-4'>
            {results[activeAnalysis] && (
              <div className='space-y-4'>
                {renderAnalysisResult(activeAnalysis, results[activeAnalysis])}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
