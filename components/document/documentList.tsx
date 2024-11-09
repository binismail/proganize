"use client";
import { useAppContext } from "@/app/context/appContext";
import DocumentItem from "./documentItem";
import {
  ArrowUpIcon,
  ChevronsUpDown,
  Link,
  PanelLeft,
  PanelRight,
  PlusIcon,
  Sparkle,
  Sparkles,
} from "lucide-react";
import logoBlack from "@/asset/proganize-dark-side.svg";
import logoWhite from "@/asset/proganize-light-side.svg";
import Image from "next/image";
import { parseISO, isToday, isYesterday, isThisWeek } from "date-fns";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { signIn } from "@/utils/supabaseOperations";
import { useState } from "react";
import { Badge } from "../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useRouter } from "next/navigation";
import { Avatar } from "@radix-ui/react-avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { UserProfilePopup } from "../shared/userProfile";
import { useTheme } from "next-themes";

export default function DocumentList() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false); // State for popover visibility
  const { state, dispatch } = useAppContext();
  const { documents, user, isLoading, subscriptionStatus, wordCredits } = state;

  interface Document {
    id: string;
    title: string;
    updated_at?: string;
    created_at: string;
    user_id: string; // Add this line
    // Add other properties as needed
  }

  // Define the structure of the grouped documents
  interface GroupedDocuments {
    Today: Document[];
    Yesterday: Document[];
    "This Week": Document[];
    Earlier: Document[];
  }

  const startNewDocument = () => {
    dispatch({ type: "SET_OPEN_DOCUMENT", payload: true });
    dispatch({ type: "SET_SELECTED_DOCUMENT", payload: null });
    dispatch({ type: "SET_PRODUCT_IDEA", payload: "" });
    dispatch({
      type: "SET_GENERATED_DOCUMENT",
      payload: "<p>Generated document for: </p>",
    });
    dispatch({ type: "SET_HAS_GENERATION_STARTED", payload: false });
    dispatch({ type: "SET_CONVERSATION", payload: [] });
    dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: false });
    dispatch({ type: "SET_SHOW_INITIAL_CONTENT", payload: true });
  };

  const formatNumberWithCommas = (number: number): string => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const groupDocumentsByDate = (docs: Document[]): GroupedDocuments => {
    const grouped: GroupedDocuments = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Earlier: [],
    };

    docs.forEach((doc) => {
      const date = parseISO(doc.updated_at || doc.created_at);
      if (isToday(date)) {
        grouped.Today.push(doc);
      } else if (isYesterday(date)) {
        grouped.Yesterday.push(doc);
      } else if (isThisWeek(date)) {
        grouped["This Week"].push(doc);
      } else {
        grouped.Earlier.push(doc);
      }
    });

    return grouped;
  };
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={`transition-all duration-300 h-screen ease-in-out flex flex-col justify-between ${isCollapsed ? "w-12" : "w-1/6"} border-r`}
    >
      <div>
        <div className='px-3 py-2'>
          {!isCollapsed && (
            <Image alt='LOGO' src={theme === "light" ? logoBlack : logoWhite} />
          )}
        </div>
        <div className='flex justify-between items-center p-2'>
          {!isCollapsed && <h2 className='text-l font-semibold'>Documents</h2>}
          <div className='flex items-center'>
            {!isCollapsed && (
              <PlusIcon
                onClick={startNewDocument}
                size={25}
                className='p-1 border rounded cursor-pointer mr-2'
              />
            )}
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <PanelLeft size={20} /> : <PanelRight size={20} />}
            </Button>
          </div>
        </div>
        {!isCollapsed && (
          <>
            {isLoading ? (
              // Skeleton loader
              <>
                {[...Array(3)].map((_, index) => (
                  <div key={index} className='space-y-2 mt-4'>
                    <Skeleton className='h-4 w-[100px]' />
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-10 w-full' />
                  </div>
                ))}
              </>
            ) : (
              // Updated document list
              Object.entries(groupDocumentsByDate(documents as Document[])).map(
                ([group, docs]) =>
                  docs.length > 0 && (
                    <div key={group}>
                      <h3 className='text-sm font-medium text-muted-foreground px-2'>
                        {group}
                      </h3>
                      {docs.map((doc: Document) => (
                        <div
                          key={doc.id}
                          className='flex items-center px-2 py-1'
                        >
                          <div className='flex-grow'>
                            <DocumentItem document={doc} />
                          </div>
                          {doc.user_id !== user.id && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge
                                    variant='secondary'
                                    className='ml-2 flex-shrink-0'
                                  >
                                    S
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>This document is shared with you</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      ))}
                    </div>
                  )
              )
            )}
          </>
        )}
      </div>
      {!user?.id && !isCollapsed && (
        <div className='px-2 mb-4'>
          <Button
            variant='outline'
            className='w-full'
            onClick={() => {
              signIn();
            }}
          >
            {"Sign in to access Pro features"}
            <Sparkles size={15} className='ml-2' />
          </Button>
        </div>
      )}

      {user?.id && (
        <div>
          <div className='px-4 mb-6'>
            {!isCollapsed && (
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>AI Words used</span>
                <span className='tabular-nums text-[10px]'>
                  {wordCredits
                    ? `${formatNumberWithCommas(wordCredits.total_words_generated)}/${formatNumberWithCommas(wordCredits.remaining_credits)}`
                    : "N/A"}
                </span>
              </div>
            )}
            <div className='h-2 rounded-full bg-muted'>
              <div
                className='h-full rounded-full bg-primary transition-all duration-300 w-full'
                style={{
                  width: `${wordCredits ? (wordCredits.total_words_generated / (wordCredits.total_words_generated + wordCredits.remaining_credits)) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <div
            className={` mb-4 border flex gap-4 ${!isCollapsed && "p-2 mx-4"} mx-1 cursor-pointer rounded-lg`}
            onClick={() => {
              setIsPopoverOpen(!isPopoverOpen);
            }}
          >
            <Avatar className='border-2 border-background inline-block'>
              <AvatarImage
                className={`${!isCollapsed && "w-10"} rounded-lg`}
                src={user?.user_metadata.avatar_url}
                alt={user?.name}
              />
              <AvatarFallback>
                {user?.user_metadata.full_name[0]}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className='flex items-center gap-2'>
                <p className='text-sm'>{user?.user_metadata.email}</p>
                <ChevronsUpDown size={15} />
              </div>
            )}
            {isPopoverOpen && ( // Render the popover conditionally
              <div className='absolute top-[50%] z-10 bg-background shadow-lg rounded-lg p-4'>
                <UserProfilePopup
                  user={user}
                  onSignOut={() => {}}
                  subscriptionStatus={subscriptionStatus}
                />{" "}
                {/* Pass user data to UserProfile */}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
