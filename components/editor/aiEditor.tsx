"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { getToken } from "@/utils/supabaseOperations";

interface AiEditorProps {
  selectedText: string;
  onUpdate: (newText: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function AiEditor({
  selectedText,
  onUpdate,
  isOpen,
  onClose,
}: AiEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editType, setEditType] = useState("custom");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedText, setGeneratedText] = useState("");

  const presetPrompts = {
    shorter: "Make this text more concise while keeping the key points",
    longer: "Expand this text with more details and examples",
    formal: "Make this text more formal and professional",
    simple: "Simplify this text to make it easier to understand",
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const prompt =
        editType === "custom"
          ? customPrompt
          : presetPrompts[editType as keyof typeof presetPrompts];

      const token = await getToken();
      console.log("Token:", token);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a helpful writing assistant. Your task is to edit and improve text while maintaining its core meaning and intent.",
            },
            {
              role: "user",
              content: `${prompt}\n\nOriginal text:\n${selectedText}`,
            },
          ],
        }),
      });

      if (!response.ok) throw new Error("Failed to generate content");

      const data = await response.json();
      setGeneratedText(data.content);
    } catch (error) {
      console.error("Error generating content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = () => {
    onUpdate(generatedText);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>AI Edit</DialogTitle>
          <DialogDescription>
            Edit your selected text with AI assistance
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='edit-type'>Edit Type</Label>
            <Select
              value={editType}
              onValueChange={(value) => {
                setEditType(value);
                setGeneratedText("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select edit type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='custom'>Custom Prompt</SelectItem>
                <SelectItem value='shorter'>Make Shorter</SelectItem>
                <SelectItem value='longer'>Make Longer</SelectItem>
                <SelectItem value='formal'>Make Formal</SelectItem>
                <SelectItem value='simple'>Simplify</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {editType === "custom" && (
            <div className='grid gap-2'>
              <Label htmlFor='custom-prompt'>Custom Prompt</Label>
              <Input
                id='custom-prompt'
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder='Enter your editing instructions...'
              />
            </div>
          )}

          <div className='grid gap-2'>
            <Label>Original Text</Label>
            <Textarea
              value={selectedText}
              readOnly
              className='min-h-[100px] bg-muted'
            />
          </div>

          {generatedText && (
            <div className='grid gap-2'>
              <Label>Generated Text</Label>
              <Textarea
                value={generatedText}
                readOnly
                className='min-h-[100px]'
              />
            </div>
          )}
        </div>

        <DialogFooter className='sm:justify-between'>
          <div className='flex gap-2'>
            <Button
              type='button'
              variant='secondary'
              onClick={handleGenerate}
              disabled={isLoading || (!customPrompt && editType === "custom")}
            >
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Generate
            </Button>
            <Button
              type='button'
              onClick={handleInsert}
              disabled={!generatedText || isLoading}
            >
              Insert
            </Button>
          </div>
          <Button type='button' variant='outline' onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
