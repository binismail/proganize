import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  Wand2,
} from "lucide-react";

interface BubbleMenuProps {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onAiEdit: () => void;
}

export function BubbleMenu({
  onBold,
  onItalic,
  onUnderline,
  onAiEdit,
}: BubbleMenuProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-background p-1 shadow-lg">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onBold}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onItalic}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onUnderline}
      >
        <Underline className="h-4 w-4" />
      </Button>
      <div className="h-4 w-[1px] bg-border" />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onAiEdit}
      >
        <Wand2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
