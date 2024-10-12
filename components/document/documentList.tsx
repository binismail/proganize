import { useAppContext } from "@/app/context/appContext";
import DocumentItem from "./documentItem";
import {
  ArrowUpIcon,
  PanelLeft,
  PanelRight,
  PlusIcon,
  Sparkle,
  Sparkles,
} from "lucide-react";
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
import { SubscribeModal } from "@/components/shared/subscribeModal";
import { useRouter } from "next/navigation";

export default function DocumentList() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const { documents, user, isLoading } = state;

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

  const premiumPlan = {
    name: "Pro",
    monthlyPrice: 20, // Adjust this to your actual price
    features: [
      "Share documents publicly with a direct link",
      "Unlimited collaborators",
      "Unlimited conversations with your documents",
      "Download documents in PDF and DOCX formats",
      "Generate add-ons (user stories, technical requirements, product roadmaps)",
      "Upload documents for AI-powered enhancement",
      "Priority support",
      "Early access to new features",
    ],
  };

  const annualDiscount = 0.2; // 20% discount for annual billing

  return (
    <div
      className={`transition-all duration-300 h-[92vh] ease-in-out flex flex-col justify-between ${isCollapsed ? "w-12" : "w-1/6"} border-r`}
    >
      <div>
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
      {!isCollapsed && (
        <div className='mt-4 px-2'>
          <Button
            variant='outline'
            className='w-full'
            onClick={() => {
              if (!user?.id) {
                signIn();
              } else {
                setIsSubscribeModalOpen(true);
              }
            }}
          >
            {!user?.id ? "Sign in to access Pro features" : "Upgrade to Pro"}
            <Sparkles size={15} className='ml-2' />
          </Button>
          {isSubscribeModalOpen && (
            <SubscribeModal
              isOpen={isSubscribeModalOpen}
              onClose={() => setIsSubscribeModalOpen(false)}
              onSubscribe={() => router.push("/subscribe")}
              plan={premiumPlan}
              initialIsAnnual={false}
              annualDiscount={annualDiscount}
            />
          )}
        </div>
      )}
    </div>
  );
}
