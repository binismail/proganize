"use client";

import { cn } from "@/lib/utils";

export function TypingBubble() {
  return (
    <div className="flex items-center space-x-2 p-4 bg-muted/50 dark:bg-muted/20 rounded-lg">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-foreground/50 dark:bg-foreground/70 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-foreground/50 dark:bg-foreground/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-foreground/50 dark:bg-foreground/70 rounded-full animate-bounce" />
      </div>
      <span className="text-sm text-muted-foreground">AI is typing...</span>
    </div>
  );
}
