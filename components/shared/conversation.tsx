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
    <div className='h-[75vh] overflow-y-auto mb-4 mt-4'>
      {conversation.map((message, index) => (
        <div key={index} className='mb-2 flex gap-2'>
          <div className='flex-shrink-0'>
            <Image
              src={
                message.role === "user"
                  ? user?.user_metadata?.avatar_url
                  : ProrganizeLogo
              }
              alt='avatar'
              width={30}
              height={30}
              className='rounded-full'
            />
          </div>
          <div
            className={`text-sm break-words overflow-wrap-anywhere flex-grow ${
              message.role === "user"
                ? "bg-gray-100 dark:bg-neutral-800 rounded-tr-lg rounded-br-lg rounded-bl-lg p-3"
                : ""
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
