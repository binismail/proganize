"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Moon,
  Sun,
  Home,
  PenTool,
  FileText,
  Book,
  ChartBar,
  Settings,
  LogOut,
  LogIn,
  Plus,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Trash2,
  PlusCircle,
} from "lucide-react";
import Image from "next/image";
import logoBlack from "@/asset/proganize-dark-side.svg";
import logoWhite from "@/asset/proganize-light-side.svg";
import { useAppContext } from "@/app/context/appContext";
import { signIn, signOut } from "@/utils/supabaseOperations";
import { supabase } from "@/utils/supabase/instance";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";
import { CreditDisplay } from "../shared/creditDisplay";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ERROR_MESSAGES, STORAGE_CONSTANTS } from "@/utils/constants";

export default function Nav() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { state, dispatch } = useAppContext();
  const { user, documents, pdfConversations } = state;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Write", href: "/write", icon: PenTool },
    { name: "PDF Tools", href: "/pdf", icon: FileText },
    { name: "Study", href: "/study", icon: Book },
    { name: "Analytics", href: "/analytics", icon: ChartBar },
    { name: "Billing", href: "/billing", icon: CreditCard },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Close all sections when navigating
    setOpenSections([]);
  }, [pathname]);

  const toggleSection = (href: string) => {
    setOpenSections((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  const filterItems = (items: any[], query: string) => {
    if (!query) return items;
    return items.filter(
      (item) =>
        item.title?.toLowerCase().includes(query.toLowerCase()) ||
        "Untitled".toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleDeleteDocument = async (e: React.MouseEvent, doc: any) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", doc.id)
        .single();

      if (error) throw error;

      dispatch({
        type: "SET_DOCUMENTS",
        payload: documents.filter((d) => d.id !== doc.id),
      });

      if (state.currentDocumentId === doc.id) {
        dispatch({ type: "SET_CURRENT_DOCUMENT_ID", payload: null });
        dispatch({ type: "SET_GENERATED_DOCUMENT", payload: "" });
        dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: false });
        dispatch({ type: "SET_SHOW_INITIAL_CONTENT", payload: true });
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document. Please try again.");
    }
  };

  const handleDeletePdfConversation = async (
    e: React.MouseEvent,
    conversation: any
  ) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      // Delete the PDF file from storage first
      const { error: storageError } = await supabase.storage
        .from(STORAGE_CONSTANTS.BUCKET_NAME)
        .remove([conversation.pdf_url]);

      if (storageError) {
        console.error("Error deleting PDF file:", storageError);
      }

      // Delete all messages
      await supabase
        .from("pdf_conversation_messages")
        .delete()
        .match({ conversation_id: conversation.id });

      // Delete extracted content
      await supabase
        .from("pdf_extracted_content")
        .delete()
        .match({ pdf_conversation_id: conversation.id });

      // Delete the conversation
      const { error: conversationError } = await supabase
        .from("pdf_conversations")
        .delete()
        .eq("id", conversation.id)
        .single();

      if (conversationError) throw conversationError;

      dispatch({
        type: "SET_PDF_CONVERSATIONS",
        payload: pdfConversations.filter((c) => c.id !== conversation.id),
      });

      if (state.currentPDFConversation?.id === conversation.id) {
        dispatch({ type: "SET_CURRENT_PDF_CONVERSATION", payload: null });
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert(ERROR_MESSAGES.DELETE_CONVERSATION_ERROR);
    }
  };

  const handleGoogleAuth = async () => {
    if (user) {
      await signOut();
      dispatch({ type: "SET_CONVERSATION", payload: [] });
      dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: false });
      dispatch({ type: "SET_HAS_GENERATION_STARTED", payload: false });
      dispatch({ type: "SET_SHOW_INITIAL_CONTENT", payload: true });
      router.push("/");
    } else {
      await signIn();
    }
  };

  const handleNewDocument = () => {
    dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: true });
    dispatch({ type: "SET_SHOW_INITIAL_CONTENT", payload: true });
    dispatch({ type: "SET_CURRENT_DOCUMENT_ID", payload: null });
    router.push("/write");
  };

  const handleNewPdfChat = () => {
    dispatch({
      type: "SET_CURRENT_PDF_CONVERSATION",
      payload: null,
    });
    router.push("/pdf");
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !state.user?.id) return;

    try {
      // Upload PDF to storage
      const fileName = `${state.user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_CONSTANTS.BUCKET_NAME)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create new conversation
      const { data: conversation, error: conversationError } = await supabase
        .from("pdf_conversations")
        .insert({
          user_id: state.user.id,
          title: file.name,
          pdf_url: fileName,
        })
        .select()
        .single();

      if (conversationError) throw conversationError;

      // Set as current conversation
      dispatch({
        type: "SET_CURRENT_PDF_CONVERSATION",
        payload: conversation,
      });

      // Navigate to PDF page
      router.push("/pdf");
    } catch (error) {
      console.error("Error uploading PDF:", error);
      alert("Failed to upload PDF. Please try again.");
    }
  };

  return (
    <nav
      className={cn(
        "flex flex-col gap-4 p-4 border-r bg-background h-screen",
        isCollapsed ? "w-[80px]" : "w-[250px]"
      )}
    >
      <div className='p-4 flex items-center justify-between'>
        {!isCollapsed && (
          <Link href='/'>
            <Image
              src={theme === "dark" ? logoWhite : logoBlack}
              alt='Proganize Logo'
              width={120}
              height={30}
              className='cursor-pointer'
            />
          </Link>
        )}
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <Menu className='h-4 w-4' />
        </Button>
      </div>

      <div className='flex-1 px-3 py-4 space-y-1'>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const showList =
            !isCollapsed &&
            ((item.href === "/write" && documents?.length > 0) ||
              (item.href === "/pdf" && pdfConversations?.length > 0));

          return (
            <div key={item.name}>
              <div className='flex items-center'>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-1 items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                    isCollapsed && "justify-center"
                  )}
                >
                  <item.icon
                    className={cn("h-5 w-5", isCollapsed ? "mr-0" : "mr-3")}
                  />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
                {!isCollapsed && showList && (
                  <Button
                    variant='ghost'
                    size='sm'
                    className='px-2'
                    onClick={() => toggleSection(item.href)}
                  >
                    {openSections.includes(item.href) ? (
                      <ChevronUp className='h-4 w-4' />
                    ) : (
                      <ChevronDown className='h-4 w-4' />
                    )}
                  </Button>
                )}
              </div>

              {showList && (
                <Collapsible
                  open={openSections.includes(item.href)}
                  onOpenChange={() => toggleSection(item.href)}
                >
                  <CollapsibleContent>
                    <div className='pl-8 pr-2 mt-1 space-y-1'>
                      {!isCollapsed && (
                        <input
                          type='text'
                          placeholder='Search...'
                          className='w-full px-2 py-1 text-sm bg-background border rounded-md mb-2'
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      )}
                      {item.href === "/write" &&
                        filterItems(documents, searchQuery)?.map((doc: any) => (
                          <div key={doc.id} className='flex items-center group'>
                            <div
                              onClick={() => {
                                dispatch({
                                  type: "SET_SELECTED_DOCUMENT",
                                  payload: doc,
                                });
                                dispatch({
                                  type: "SET_PRODUCT_IDEA",
                                  payload: "",
                                });
                                dispatch({
                                  type: "SET_CONVERSATION",
                                  payload: doc.conversation,
                                });
                                dispatch({
                                  type: "SET_HAS_GENERATION_STARTED",
                                  payload: true,
                                });
                                dispatch({
                                  type: "SET_GENERATED_DOCUMENT",
                                  payload: doc.content,
                                });
                                dispatch({
                                  type: "SET_IS_EDITOR_VISIBLE",
                                  payload: true,
                                });
                                dispatch({
                                  type: "SET_CURRENT_DOCUMENT_ID",
                                  payload: doc.id,
                                });
                                dispatch({
                                  type: "SET_SHOW_INITIAL_CONTENT",
                                  payload: false,
                                });
                                router.push(`/write?id=${doc.id}`);
                              }}
                              className={cn(
                                "flex-1 block py-1 px-2 text-sm rounded hover:bg-muted truncate cursor-pointer",
                                pathname === `/write?id=${doc.id}` && "bg-muted"
                              )}
                            >
                              {doc.title || "Untitled"}
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='opacity-0 group-hover:opacity-100 transition-opacity'
                              onClick={(e) => handleDeleteDocument(e, doc)}
                            >
                              <Trash2 className='h-4 w-4 text-muted-foreground hover:text-destructive' />
                            </Button>
                          </div>
                        ))}
                      {item.href === "/pdf" &&
                        filterItems(pdfConversations, searchQuery)?.map(
                          (conv: any) => (
                            <div
                              key={conv.id}
                              className='flex items-center group'
                            >
                              <div
                                onClick={() => {
                                  dispatch({
                                    type: "SET_CURRENT_PDF_CONVERSATION",
                                    payload: conv,
                                  });
                                  router.push(`/pdf?id=${conv.id}`);
                                }}
                                className={cn(
                                  "flex-1 block py-1 px-2 text-sm rounded hover:bg-muted truncate cursor-pointer",
                                  pathname === `/pdf?id=${conv.id}` &&
                                    "bg-muted"
                                )}
                              >
                                {conv.title || "Untitled"}
                              </div>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='opacity-0 group-hover:opacity-100 transition-opacity'
                                onClick={(e) =>
                                  handleDeletePdfConversation(e, conv)
                                }
                              >
                                <Trash2 className='h-4 w-4 text-muted-foreground hover:text-destructive' />
                              </Button>
                            </div>
                          )
                        )}
                      <Button
                        variant='ghost'
                        size='sm'
                        className='w-full justify-start mt-1'
                        onClick={
                          item.href === "/write"
                            ? handleNewDocument
                            : handleNewPdfChat
                        }
                      >
                        <Plus className='h-4 w-4 mr-2' />
                        New {item.href === "/write" ? "Document" : "Chat"}
                      </Button>
                      {item.href === "/pdf" && (
                        <input
                          type='file'
                          ref={fileInputRef}
                          accept='.pdf'
                          onChange={handleFileUpload}
                          className='hidden'
                        />
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          );
        })}
      </div>

      <div className='border-t border-border py-4'>
        <div className='px-3 flex items-center justify-between'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className='h-4 w-4' />
            ) : (
              <Moon className='h-4 w-4' />
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='sm'>
                  <Avatar className='h-6 w-6'>
                    <AvatarImage
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata.full_name}
                    />
                    <AvatarFallback>
                      {user.user_metadata.full_name?.charAt(0) ||
                        user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={handleGoogleAuth}>
                  <LogOut className='h-4 w-4 mr-2' />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant='ghost' size='sm' onClick={handleGoogleAuth}>
              <LogIn className='h-4 w-4 mr-2' />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
