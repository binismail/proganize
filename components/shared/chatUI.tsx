import { useState } from "react";
import { Close } from "@radix-ui/react-toast";
import Conversation from "./conversation";
import DocumentGenerator from "./documentGenerator";
import { Sparkles, X } from "lucide-react";
import "./chatUi.css"; // Import the CSS file for styles

export default function AiChat({
  isCollapsed,
  onClose,
}: {
  isCollapsed: boolean;
  onClose: any;
}) {
  return (
    <>
      {!isCollapsed && (
        <div className='chat-container fixed right-0 bottom-10  w-[500px] h-[65vh] flex mr-20 flex-col max-w-4xl mx-auto p-4 space-y-4 bg-background shadow-sm rounded-3xl border'>
          <div className='flex justify-between items-center'>
            <div className='flex items-center'>
              <Sparkles size={15} className='mr-2' color='#8f31e3' />
              <p className='font-bold'>Chat with AI</p>
            </div>
            <X size={20} className='cursor-pointer' onClick={onClose} />
          </div>
          <Conversation />
          <DocumentGenerator
            subscriptionStatus='inactive'
            placeholderText='Ask me anything related to your document' // Add appropriate placeholder text
          />
        </div>
      )}
      {isCollapsed && (
        <div className='flex justify-between items-center px-4 border h-12 mr-2 rounded-full fixed right-10 bottom-20'>
          <div className='flex items-center cursor-pointer' onClick={onClose}>
            <Sparkles size={15} className='mr-2' color='#8f31e3' />
            <p className=''>Chat with AI</p>
          </div>
        </div>
      )}
    </>
  );
}
