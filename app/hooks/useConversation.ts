import { useState } from "react";

export const useConversation = () => {
  const [conversation, setConversation] = useState<string[]>([]);

  const addMessage = (message: string) => {
    setConversation((prev) => [...prev, message]);
  };

  const clearConversation = () => {
    setConversation([]);
  };

  return { conversation, addMessage, clearConversation };
};
