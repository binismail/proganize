import { useAppContext } from "@/app/context/appContext";
import Image from "next/image";
import ProrganizeLogo from "@/asset/Icon-prorganize.png";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useRef } from "react";

const Conversation = () => {
  const { state } = useAppContext();
  const { conversation, user } = state;
  const conversationEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  return (
    <div className='h-[75vh] flex flex-col overflow-y-auto mb-4 mt-4 overflow-hidden mr-2'>
      {conversation.map((message, index) => (
        <div
          key={index}
          className={`mb-4 gap-3 ${
            message.role === "user" ? "justify-self-end" : "justify-start"
          }`}
        >
          <div
            className={`text-sm break-words overflow-wrap-anywhere flex-grow ${
              message.role === "user"
                ? `bg-gray-100 dark:bg-neutral-800 ${message.content.length > 50 ? "rounded-3xl" : "rounded-full pr-5"} p-3 inline-block`
                : "border p-4 rounded-3xl"
            }`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      ))}
      <div ref={conversationEndRef} />
    </div>
  );
};

export default Conversation;
