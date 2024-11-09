import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { Toolbar } from "./toolbar";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BubbleMenu } from "../shared/bubbleMenue";
import { useAppContext } from "@/app/context/appContext";

interface EditorProps {
  initialContent?: string;
  onUpdate?: (content: string) => void;
  onSelectionChange?: (selection: Selection | null) => void;
  formatText?: (command: string, value?: string) => void;
  alignText?: (alignment: string) => void;
  toggleList?: (listType: "unordered" | "ordered") => void;
  formatBlock?: (block: string) => void;
  generateAIPrompt?: (selectedText: string) => Promise<string>;
  editable: boolean;
}

export default function RichTextEditor({
  initialContent = "",
  onUpdate,
  onSelectionChange,
  formatText: externalFormatText,
  alignText: externalAlignText,
  toggleList: externalToggleList,
  formatBlock: externalFormatBlock,
  generateAIPrompt,
  editable,
}: EditorProps) {
  const [currentHeading, setCurrentHeading] = useState("p");
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [showBubbleMenu, setShowBubbleMenu] = useState(false);
  const [bubbleMenuPosition, setBubbleMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const isTypingRef = useRef(false);
  const { state } = useAppContext();

  useEffect(() => {
    const convertMarkdownToHTML = async () => {
      if (!editorRef.current) return; // Add null check

      // Create a temporary div to sanitize the content
      const tempDiv = document.createElement("div");
      const parsedContent = await marked.parse(initialContent);
      tempDiv.innerHTML = parsedContent;

      // Ensure all elements inside have proper direction
      const allElements = tempDiv.getElementsByTagName("*");
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i] as HTMLElement;
        element.setAttribute("dir", "ltr");
        element.style.textAlign = "left";
      }

      // Only update if content has changed
      if (editorRef.current.innerHTML !== tempDiv.innerHTML) {
        editorRef.current.innerHTML = tempDiv.innerHTML;
        editorRef.current.dir = "ltr";
        if (onUpdate) {
          onUpdate(tempDiv.innerHTML);
        }
      }
    };
    convertMarkdownToHTML();
  }, [initialContent, onUpdate]);

  const saveSelection = useCallback(() => {
    if (isTypingRef.current) return; // Don't save selection while typing

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
      setSelectedText(selection.toString());

      if (selection.toString().trim() !== "") {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setBubbleMenuPosition({
          top: rect.top - 40,
          left: rect.left + rect.width / 2,
        });
        setShowBubbleMenu(true);
      } else {
        setShowBubbleMenu(false);
      }

      const parentElement = selection.anchorNode?.parentElement;
      if (parentElement) {
        const headingTag = parentElement.tagName.toLowerCase();
        if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(headingTag)) {
          setCurrentHeading(headingTag);
        } else {
          setCurrentHeading("p");
        }
      }

      if (onSelectionChange) {
        onSelectionChange(selection);
      }
    }
  }, [onSelectionChange]);

  useEffect(() => {
    document.addEventListener("selectionchange", saveSelection);
    return () => document.removeEventListener("selectionchange", saveSelection);
  }, [saveSelection]);

  const updateContent = useCallback(() => {
    if (onUpdate && editorRef.current) {
      onUpdate(editorRef.current.innerHTML);
    }
  }, [onUpdate]);

  const handleInput = useCallback(
    (event: React.FormEvent<HTMLDivElement>) => {
      isTypingRef.current = true;

      // Ensure LTR direction
      if (editorRef.current) {
        editorRef.current.dir = "ltr";

        // Force text alignment if needed
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const parentBlock = range.startContainer.parentElement;
          if (parentBlock) {
            parentBlock.style.textAlign = "left";
            parentBlock.dir = "ltr";
          }
        }
      }

      updateContent();

      // Reset typing flag after a short delay
      setTimeout(() => {
        isTypingRef.current = false;
      }, 100);
    },
    [updateContent]
  );

  const formatText = useCallback(
    (command: string, value?: string) => {
      if (externalFormatText) {
        externalFormatText(command, value);
      } else {
        document.execCommand(command, false, value);
      }
      editorRef.current?.focus();
      updateContent();
    },
    [externalFormatText, updateContent]
  );

  const alignText = useCallback(
    (alignment: string) => {
      if (externalAlignText) {
        externalAlignText(alignment);
      } else {
        document.execCommand("justify" + alignment, false, undefined);
      }
      editorRef.current?.focus();
      updateContent();
    },
    [externalAlignText, updateContent]
  );

  const handleHeadingChange = useCallback(
    (value: string) => {
      if (externalFormatBlock) {
        externalFormatBlock(value);
      } else {
        document.execCommand("formatBlock", false, value);
      }
      setCurrentHeading(value);
      editorRef.current?.focus();
      updateContent();
    },
    [externalFormatBlock, updateContent]
  );

  const toggleList = useCallback(
    (listType: "unordered" | "ordered") => {
      if (externalToggleList) {
        externalToggleList(listType);
      } else {
        const command =
          listType === "unordered"
            ? "insertUnorderedList"
            : "insertOrderedList";
        document.execCommand(command, false, undefined);
      }
      editorRef.current?.focus();
      updateContent();
    },
    [externalToggleList, updateContent]
  );

  const handleEnhanceWithAI = async () => {
    const textToEnhance = selectedText || (editorRef.current?.innerText ?? "");
    // const prompt = await generateAIPrompt(textToEnhance);
    setAiPrompt(`${textToEnhance}`);
    setIsAIDialogOpen(true);
  };

  const handleAcceptAIPrompt = () => {
    if (aiPrompt && editorRef.current) {
      if (selectionRef.current) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(selectionRef.current);
          document.execCommand("insertText", false, aiPrompt);
        }
      } else {
        editorRef.current.innerHTML += aiPrompt;
      }
      updateContent();
    }
    setIsAIDialogOpen(false);
    setAiPrompt(null);
    selectionRef.current = null;
    setSelectedText("");
  };

  return (
    <div className='w-full max-w-4xl mx-auto p-4 mt-10 '>
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
        .editor-content code {
          background: #0000;
          font-size: 14px;
          outline: none;
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
        className='editor-content p-4 min-h-[200px] focus:outline-none text-left'
        contentEditable={editable}
        suppressContentEditableWarning
        onInput={handleInput}
        dir='ltr' // Add this attribute
      />
      {showBubbleMenu && (
        <BubbleMenu
          position={bubbleMenuPosition}
          onFormatText={formatText}
          onAlignText={alignText}
          onHeadingChange={handleHeadingChange}
          onEnhanceWithAI={handleEnhanceWithAI}
        />
      )}
      {/* <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
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
      </Dialog> */}
    </div>
  );
}
