import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FileText,
  ListTodo,
  BookOpen,
  BrainCircuit,
  List,
  Lightbulb,
} from 'lucide-react';
import { useAppContext } from '@/app/context/appContext';
import { pdfService } from '@/utils/services/pdfService';

interface AnalysisResult {
  summary?: string;
  keyPoints?: string[];
  topics?: string[];
  toc?: { title: string; page: number }[];
  flashcards?: Array<{ question: string; answer: string }>;
  quiz?: Array<{ question: string; options: string[]; answer: string }>;
}

export default function PDFAnalysisTools() {
  const { state } = useAppContext();
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'analysis' | 'study'>('analysis');
  const [results, setResults] = React.useState<AnalysisResult>({});

  const analyzeDocument = async (type: 'summary' | 'keyPoints' | 'topics' | 'toc') => {
    if (!state.currentPDFConversation?.id) return;

    setIsLoading(true);
    try {
      const content = await pdfService.getExtractedContent(
        state.currentPDFConversation.id
      );

      if (!content?.content) {
        throw new Error('No content found for analysis');
      }

      let result: string | string[] | Array<{ title: string; page: number }>;
      switch (type) {
        case 'summary':
          result = await pdfService.generateSummary(content.content);
          setResults(prev => ({ ...prev, summary: result as string }));
          break;
        case 'keyPoints':
          result = await pdfService.extractKeyPoints(content.content);
          setResults(prev => ({ ...prev, keyPoints: result as string[] }));
          break;
        case 'topics':
          result = await pdfService.identifyTopics(content.content);
          setResults(prev => ({ ...prev, topics: result as string[] }));
          break;
        case 'toc':
          result = await pdfService.generateTOC(content.content);
          setResults(prev => ({ ...prev, toc: result as Array<{ title: string; page: number }> }));
          break;
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const generateStudyMaterial = async (type: 'flashcards' | 'quiz') => {
    if (!state.currentPDFConversation?.id) return;

    setIsLoading(true);
    try {
      const content = await pdfService.getExtractedContent(
        state.currentPDFConversation.id
      );

      if (!content?.content) {
        throw new Error('No content found for study material generation');
      }

      console.log('Generating study material:', type);

      let result: Array<{ question: string; answer: string }> | Array<{ question: string; options: string[]; answer: string }>;
      switch (type) {
        case 'flashcards':
          result = await pdfService.generateFlashcards(content.content);
          console.log('Flashcards result:', result);
          if (!Array.isArray(result)) {
            throw new Error('Invalid flashcards response format');
          }
          setResults(prev => {
            console.log('Setting flashcards:', result);
            return { ...prev, flashcards: result };
          });
          break;
        case 'quiz':
          result = await pdfService.generateQuiz(content.content);
          console.log('Quiz result:', result);
          if (!Array.isArray(result)) {
            throw new Error('Invalid quiz response format');
          }
          setResults(prev => {
            console.log('Setting quiz:', result);
            return { ...prev, quiz: result };
          });
          break;
      }
    } catch (error) {
      console.error('Study material generation error:', error);
      alert(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex space-x-2 mb-4">
        <Button
          variant={activeTab === 'analysis' ? 'default' : 'outline'}
          onClick={() => setActiveTab('analysis')}
        >
          <FileText className="w-4 h-4 mr-2" />
          Document Analysis
        </Button>
        <Button
          variant={activeTab === 'study' ? 'default' : 'outline'}
          onClick={() => setActiveTab('study')}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Study Aids
        </Button>
      </div>

      {activeTab === 'analysis' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BrainCircuit className="w-4 h-4 mr-2" />
                Summary
              </CardTitle>
              <CardDescription>Get a concise summary of the document</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => analyzeDocument('summary')}
                disabled={isLoading}
              >
                Generate Summary
              </Button>
              {results.summary && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  {results.summary}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ListTodo className="w-4 h-4 mr-2" />
                Key Points
              </CardTitle>
              <CardDescription>Extract main points and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => analyzeDocument('keyPoints')}
                disabled={isLoading}
              >
                Extract Key Points
              </Button>
              {results.keyPoints && (
                <ul className="mt-4 space-y-2">
                  {results.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="w-4 h-4 mr-2" />
                Topics
              </CardTitle>
              <CardDescription>Identify main themes and topics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => analyzeDocument('topics')}
                disabled={isLoading}
              >
                Identify Topics
              </Button>
              {results.topics && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {results.topics.map((topic, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-primary/10 rounded-full text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <List className="w-4 h-4 mr-2" />
                Table of Contents
              </CardTitle>
              <CardDescription>Generate document structure</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => analyzeDocument('toc')}
                disabled={isLoading}
              >
                Generate TOC
              </Button>
              {results.toc && (
                <div className="mt-4 space-y-2">
                  {results.toc.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{item.title}</span>
                      <span className="text-muted-foreground">p.{item.page}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Flashcards
              </CardTitle>
              <CardDescription>Generate study flashcards</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => generateStudyMaterial('flashcards')}
                disabled={isLoading}
              >
                Generate Flashcards
              </Button>
              {results.flashcards && (
                <div className="mt-4 space-y-4">
                  {results.flashcards.map((card, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="font-medium mb-2">Q: {card.question}</div>
                      <div className="text-muted-foreground">A: {card.answer}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ListTodo className="w-4 h-4 mr-2" />
                Quiz
              </CardTitle>
              <CardDescription>Generate practice questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => generateStudyMaterial('quiz')}
                disabled={isLoading}
              >
                Generate Quiz
              </Button>
              {results.quiz && (
                <div className="mt-4 space-y-6">
                  {results.quiz.map((q, i) => (
                    <div key={i} className="space-y-2">
                      <div className="font-medium">Q{i + 1}: {q.question}</div>
                      <div className="space-y-1 ml-4">
                        {q.options.map((option, j) => (
                          <div key={j} className="flex items-center">
                            <span className="mr-2">{String.fromCharCode(65 + j)}.</span>
                            {option}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-muted-foreground">
                        Answer: {q.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
