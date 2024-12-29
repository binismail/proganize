export default function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
