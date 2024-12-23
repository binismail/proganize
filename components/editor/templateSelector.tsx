"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Linkedin,
  Twitter,
  Facebook,
  BookOpen,
  Search,
  Video,
  Mail,
  MessageSquare,
  FileText,
  PenTool,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreditDisplay } from "../shared/creditDisplay";

interface Template {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: string;
  prompts: {
    label: string;
    key: string;
    type: string;
    placeholder: string;
    required?: boolean;
  }[];
}

const templates: Template[] = [
  {
    id: "linkedin-post",
    title: "LinkedIn Post",
    description: "Create engaging LinkedIn posts that drive engagement",
    icon: Linkedin,
    category: "Social Media",
    prompts: [
      {
        label: "Topic",
        key: "topic",
        type: "text",
        placeholder: "What's your post about?",
        required: true,
      },
      {
        label: "Key Points",
        key: "keyPoints",
        type: "text",
        placeholder: "Main points to cover (comma separated)",
        required: true,
      },
      {
        label: "Tone",
        key: "tone",
        type: "text",
        placeholder: "Professional, Inspirational, Story-based",
      },
    ],
  },
  {
    id: "tweet-thread",
    title: "Tweet Thread",
    description: "Craft viral Twitter threads that captivate your audience",
    icon: Twitter,
    category: "Social Media",
    prompts: [
      {
        label: "Main Topic",
        key: "topic",
        type: "text",
        placeholder: "What's your thread about?",
        required: true,
      },
      {
        label: "Number of Tweets",
        key: "tweetCount",
        type: "number",
        placeholder: "How many tweets in the thread?",
      },
    ],
  },
  {
    id: "blog-post",
    title: "SEO Blog Post",
    description: "Write SEO-optimized blog posts that rank well",
    icon: FileText,
    category: "Content",
    prompts: [
      {
        label: "Title",
        key: "title",
        type: "text",
        placeholder: "Your blog post title",
        required: true,
      },
      {
        label: "Keywords",
        key: "keywords",
        type: "text",
        placeholder: "Target keywords (comma separated)",
        required: true,
      },
      {
        label: "Word Count",
        key: "wordCount",
        type: "number",
        placeholder: "Desired word count",
      },
    ],
  },
  {
    id: "essay",
    title: "Essay",
    description: "Write well-structured essays on any topic",
    icon: BookOpen,
    category: "Academic",
    prompts: [
      {
        label: "Topic",
        key: "topic",
        type: "text",
        placeholder: "Essay topic",
        required: true,
      },
      {
        label: "Type",
        key: "type",
        type: "text",
        placeholder: "Argumentative, Expository, Narrative",
      },
    ],
  },
  {
    id: "facebook-ad",
    title: "Facebook Ad",
    description: "Create compelling Facebook ads that convert",
    icon: Facebook,
    category: "Marketing",
    prompts: [
      {
        label: "Product/Service",
        key: "product",
        type: "text",
        placeholder: "What are you promoting?",
        required: true,
      },
      {
        label: "Target Audience",
        key: "audience",
        type: "text",
        placeholder: "Who is this ad for?",
        required: true,
      },
      {
        label: "Key Benefit",
        key: "benefit",
        type: "text",
        placeholder: "Main benefit or offer",
        required: true,
      },
    ],
  },
  {
    id: "video-script",
    title: "Video Script",
    description: "Write engaging video scripts for any platform",
    icon: Video,
    category: "Content",
    prompts: [
      {
        label: "Topic",
        key: "topic",
        type: "text",
        placeholder: "What's your video about?",
        required: true,
      },
      {
        label: "Duration",
        key: "duration",
        type: "text",
        placeholder: "Estimated video length",
      },
      {
        label: "Platform",
        key: "platform",
        type: "text",
        placeholder: "YouTube, TikTok, Instagram",
      },
    ],
  },
];

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template, values: any) => void;
}

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate, formValues);
      setSelectedTemplate(null);
      setFormValues({});
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(
    new Set(templates.map((template) => template.category))
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {categories.map((category) => {
        const categoryTemplates = filteredTemplates.filter(
          (t) => t.category === category
        );
        if (categoryTemplates.length === 0) return null;

        return (
          <div key={category} className="space-y-4">
            <h2 className="text-lg font-semibold">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryTemplates.map((template) => (
                <Dialog key={template.id}>
                  <DialogTrigger asChild>
                    <Card
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedTemplate?.id === template.id &&
                          "border-primary"
                      )}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader>
                        <div className="flex items-center space-x-2">
                          <template.icon className="h-5 w-5" />
                          <CardTitle className="text-lg">
                            {template.title}
                          </CardTitle>
                        </div>
                        <CardDescription>
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{template.title}</DialogTitle>
                      <DialogDescription>
                        Fill in the details below to generate your content
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <CreditDisplay variant="full" />
                      {template.prompts.map((prompt) => (
                        <div key={prompt.key} className="space-y-2">
                          <Label htmlFor={prompt.key}>
                            {prompt.label}
                            {prompt.required && (
                              <span className="text-red-500">*</span>
                            )}
                          </Label>
                          <Input
                            id={prompt.key}
                            type={prompt.type}
                            placeholder={prompt.placeholder}
                            value={formValues[prompt.key] || ""}
                            onChange={(e) =>
                              setFormValues({
                                ...formValues,
                                [prompt.key]: e.target.value,
                              })
                            }
                            required={prompt.required}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleSubmit}>Generate Content</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
