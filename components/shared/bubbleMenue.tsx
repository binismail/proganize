import React from "react";
import { Button } from "@/components/ui/button";
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
  Type,
} from "lucide-react";

interface BubbleMenuProps {
  position: { top: number; left: number };
  onFormatText: (command: string, value?: string) => void;
  onAlignText: (alignment: string) => void;
  onHeadingChange: (heading: string) => void;
  onEnhanceWithAI: () => void;
}

export const BubbleMenu: React.FC<BubbleMenuProps> = ({
  position,
  onFormatText,
  onAlignText,
  onHeadingChange,
  onEnhanceWithAI,
}) => {
  return (
    <div
      className='absolute bg-background border rounded-full shadow-md p-1.5 flex items-center space-x-1'
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
    >
      <Button variant='ghost' size='icon' onClick={() => onFormatText("bold")}>
        <Bold className='h-4 w-4' />
      </Button>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => onFormatText("italic")}
      >
        <Italic className='h-4 w-4' />
      </Button>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => onFormatText("underline")}
      >
        <Underline className='h-4 w-4' />
      </Button>
      <Button variant='ghost' size='icon' onClick={() => onAlignText("left")}>
        <AlignLeft className='h-4 w-4' />
      </Button>
      <Button variant='ghost' size='icon' onClick={() => onAlignText("center")}>
        <AlignCenter className='h-4 w-4' />
      </Button>
      <Button variant='ghost' size='icon' onClick={() => onAlignText("right")}>
        <AlignRight className='h-4 w-4' />
      </Button>
      <Button variant='ghost' size='icon' onClick={() => onHeadingChange("p")}>
        <Type className='h-4 w-4' />
      </Button>
      <Button variant='ghost' size='icon' onClick={() => onHeadingChange("h1")}>
        <Heading1 className='h-4 w-4' />
      </Button>
      <Button variant='ghost' size='icon' onClick={() => onHeadingChange("h2")}>
        <Heading2 className='h-4 w-4' />
      </Button>
      {/* <Button variant='ghost' size='icon' onClick={onEnhanceWithAI}>
        <Sparkles className='h-4 w-4' />
      </Button> */}
    </div>
  );
};
