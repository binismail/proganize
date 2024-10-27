import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Sparkles,
} from "lucide-react";

interface EditorProps {
  initialContent?: string;
  onUpdate?: (content: string) => void;
  generateAIPrompt?: (selectedText: string) => Promise<string>;
}

export default function LightRichTextEditor({
  initialContent = "",
  onUpdate,
  generateAIPrompt,
}: EditorProps) {
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [showBubbleMenu, setShowBubbleMenu] = useState(false);
  const [bubbleMenuPosition, setBubbleMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent]);

  const updateContent = useCallback(() => {
    if (onUpdate && editorRef.current) {
      onUpdate(editorRef.current.innerHTML);
    }
  }, [onUpdate]);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      selectionRef.current = range.cloneRange();

      if (selection.toString().trim() !== "") {
        const rect = range.getBoundingClientRect();
        setBubbleMenuPosition({
          top: rect.top - 40,
          left: rect.left + rect.width / 2,
        });
        setShowBubbleMenu(true);
      } else {
        setShowBubbleMenu(false);
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  const handleInput = useCallback(() => {
    updateContent();
  }, [updateContent]);

  const formatText = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      updateContent();
    },
    [updateContent]
  );

  const handleEnhanceWithAI = async () => {
    if (generateAIPrompt && selectionRef.current) {
      const selectedText = selectionRef.current.toString();
      const prompt = await generateAIPrompt(selectedText);
      setAiPrompt(prompt);
      setIsAIDialogOpen(true);
    }
  };

  const handleAcceptAIPrompt = () => {
    if (aiPrompt && selectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(selectionRef.current);
        document.execCommand("insertText", false, aiPrompt);
      }
      updateContent();
    }
    setIsAIDialogOpen(false);
    setAiPrompt(null);
  };

  const BubbleMenu = () => (
    <div
      className='absolute bg-background border rounded-md shadow-md p-1 flex items-center space-x-1'
      style={{
        top: `${bubbleMenuPosition.top}px`,
        left: `${bubbleMenuPosition.left}px`,
        transform: "translateX(-50%)",
      }}
    >
      <Button variant='ghost' size='icon' onClick={() => formatText("bold")}>
        <Bold className='h-4 w-4' />
      </Button>
      <Button variant='ghost' size='icon' onClick={() => formatText("italic")}>
        <Italic className='h-4 w-4' />
      </Button>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => formatText("underline")}
      >
        <Underline className='h-4 w-4' />
      </Button>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => formatText("justifyLeft")}
      >
        <AlignLeft className='h-4 w-4' />
      </Button>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => formatText("justifyCenter")}
      >
        <AlignCenter className='h-4 w-4' />
      </Button>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => formatText("justifyRight")}
      >
        <AlignRight className='h-4 w-4' />
      </Button>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => formatText("formatBlock", "<h1>")}
      >
        <Heading1 className='h-4 w-4' />
      </Button>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => formatText("formatBlock", "<h2>")}
      >
        <Heading2 className='h-4 w-4' />
      </Button>
      <Button variant='ghost' size='icon' onClick={handleEnhanceWithAI}>
        <Sparkles className='h-4 w-4' />
      </Button>
    </div>
  );

  return (
    <div className='w-full max-w-4xl mx-auto p-4 mt-10'>
      <style jsx global>{`
        .editor-content {
          line-height: 1.5;
          direction: ltr;
          unicode-bidi: isolate;
          text-align: left;
        }
        .editor-content p,
        .editor-content ul,
        .editor-content ol {
          margin-bottom: 0.5em;
        }
        .editor-content h1,
        .editor-content h2,
        .editor-content h3,
        .editor-content h4,
        .editor-content h5,
        .editor-content h6 {
          margin-bottom: 0.5em;
          font-weight: bold;
        }
        .editor-content h1 {
          font-size: 2em;
        }
        .editor-content h2 {
          font-size: 1.5em;
        }
        .editor-content h3 {
          font-size: 1.17em;
        }
        .editor-content h4 {
          font-size: 1em;
        }
        .editor-content h5 {
          font-size: 0.83em;
        }
        .editor-content h6 {
          font-size: 0.67em;
        }
        .editor-content ul,
        .editor-content ol {
          margin-left: 1.5em;
          list-style-position: outside;
        }
        .editor-content ul {
          list-style-type: disc;
        }
        .editor-content ol {
          list-style-type: decimal;
        }
        .editor-content li {
          margin-bottom: 0.25em;
        }
        .editor-content pre {
          background-color: #f4f4f4;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 1em;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .editor-content blockquote {
          border-left: 3px solid #ccc;
          margin: 1em 0;
          padding-left: 1em;
          font-style: italic;
        }
      `}</style>
      <div
        ref={editorRef}
        className='editor-content p-4 min-h-[200px] focus:outline-none border rounded-md'
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        dir='ltr'
      />
      {showBubbleMenu && <BubbleMenu />}
      <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI-Enhanced Content</DialogTitle>
            <DialogDescription>
              Here's the AI-generated content. Would you like to add it to your
              editor?
            </DialogDescription>
          </DialogHeader>
          <div className='mt-4 p-4 bg-gray-100 rounded-md'>
            <p>{aiPrompt}</p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsAIDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcceptAIPrompt}>Accept</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
