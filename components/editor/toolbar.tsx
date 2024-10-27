import React from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  CircleCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "../shared/spinner";
import { useAppContext } from "@/app/context/appContext";

interface ToolbarProps {
  currentHeading: string;
  onHeadingChange: (value: string) => void;
  onFormatText: (command: string, value?: string) => void;
  onAlignText: (alignment: string) => void;
  onToggleList: (listType: "unordered" | "ordered") => void;
  onFormatBlock: (block: string) => void;
}

export function Toolbar({
  currentHeading,
  onHeadingChange,
  onFormatText,
  onAlignText,
  onToggleList,
  onFormatBlock,
}: ToolbarProps) {
  const {
    state: { saveStatus },
  } = useAppContext();

  return (
    <div className='mb-4 flex justify-between flex-wrap gap-2 w-full border-b p-5 bg-background'>
      <div className='flex flex-wrap gap-2'>
        <Select value={currentHeading} onValueChange={onHeadingChange}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Paragraph' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='p'>Paragraph</SelectItem>
            <SelectItem value='h1'>Heading 1</SelectItem>
            <SelectItem value='h2'>Heading 2</SelectItem>
            <SelectItem value='h3'>Heading 3</SelectItem>
            <SelectItem value='h4'>Heading 4</SelectItem>
            <SelectItem value='h5'>Heading 5</SelectItem>
            <SelectItem value='h6'>Heading 6</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant='outline'
          size='icon'
          onClick={() => onFormatText("bold")}
        >
          <Bold className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          size='icon'
          onClick={() => onFormatText("italic")}
        >
          <Italic className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          size='icon'
          onClick={() => onFormatText("underline")}
        >
          <Underline className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          size='icon'
          onClick={() => onFormatText("strikethrough")}
        >
          <Strikethrough className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          size='icon'
          onClick={() => onAlignText("Left")}
        >
          <AlignLeft className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          size='icon'
          onClick={() => onAlignText("Center")}
        >
          <AlignCenter className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          size='icon'
          onClick={() => onAlignText("Right")}
        >
          <AlignRight className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          size='icon'
          onClick={() => onToggleList("unordered")}
        >
          <List className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          size='icon'
          onClick={() => onToggleList("ordered")}
        >
          <ListOrdered className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          size='icon'
          onClick={() => onFormatBlock("pre")}
        >
          <Code className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          size='icon'
          onClick={() => onFormatBlock("blockquote")}
        >
          <Quote className='h-4 w-4' />
        </Button>
      </div>

      <div className='w-[100px] h-10 border flex rounded-full items-center justify-center'>
        <p className='mr-2 text-sm'>{saveStatus ? "saved" : "saving"}</p>
        {saveStatus ? <CircleCheck size={15} /> : <Spinner size='sm' />}
      </div>
    </div>
  );
}
