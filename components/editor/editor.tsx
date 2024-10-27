"use client";

import { useAppContext } from "@/app/context/appContext";
import { useEffect, useCallback, useRef, useState } from "react";
import { supabase } from "@/utils/supabase/instance";
import debounce from "lodash/debounce";
import { BetweenVerticalEnd, FilePenLine, Share2Icon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShareModal } from "../shared/shareModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import RichTextEditor from "./customEditor";
import { Toolbar } from "./toolbar";
import Conversation from "../shared/conversation";
import AiChat from "../shared/chatUI";
import { Spinner } from "../shared/spinner";

export default function EnhancedEditor() {
  const { state, dispatch } = useAppContext();
  const {
    generatedDocument,
    currentDocumentId,
    documentUpdated,
    user,
    subscriptionStatus,
    documents,
  } = state;
  const { toast } = useToast();
  const [collaborators, setCollaborators] = useState<
    { id: string; name: string; avatar: string; role: string }[]
  >([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null); // Reference to the editor
  const [currentSelection, setCurrentSelection] = useState<Selection | null>(
    null
  );

  // Add a new state to track if the user is a viewer
  const [isViewer, setIsViewer] = useState(false);

  const isActiveSubscription = subscriptionStatus === "active";

  // useEffect(() => {
  //   console.log(currentDocumentId);
  // }, [currentDocumentId]);

  const saveDocumentContent = useCallback(
    debounce(async (documentId: string, content: string) => {
      dispatch({
        type: "SET_SAVING_STATUS",
        payload: false,
      });
      const { data, error } = await supabase
        .from("documents")
        .update({ content })
        .eq("id", documentId)
        .select();

      if (error) {
        toast({
          title: "Error saving document",
          description: error.message,
          variant: "destructive",
        });
      } else if (data && data[0]) {
        dispatch({
          type: "SET_SAVING_STATUS",
          payload: true,
        });
      }
    }, 1000),
    []
  );

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!currentDocumentId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel(`documents:${currentDocumentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "documents",
          filter: `id=eq.${currentDocumentId}`,
        },
        (payload) => {
          if (payload.new.content !== generatedDocument) {
            dispatch({
              type: "SET_GENERATED_DOCUMENT",
              payload: payload.new.content,
            });
          } else {
            console.log("Document content already up to date");
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentDocumentId, dispatch, generatedDocument]);

  useEffect(() => {
    if (generatedDocument) {
      dispatch({ type: "SET_DOCUMENT_UPDATED", payload: false });
    }
  }, [generatedDocument, documentUpdated, dispatch]);

  useEffect(() => {
    if (currentDocumentId) {
      const fetchDocumentData = async () => {
        // Fetch document content
        const { data: documentData, error: documentError } = await supabase
          .from("documents")
          .select("content")
          .eq("id", currentDocumentId)
          .single();

        if (documentError) {
          console.error("Error fetching document content:", documentError);
          return;
        }

        if (documentData) {
          dispatch({
            type: "SET_GENERATED_DOCUMENT",
            payload: documentData.content,
          });
        }

        // Fetch collaborators
        const { data: collaboratorsData, error: collaboratorsError } =
          await supabase
            .from("document_collaborators")
            .select(
              `
            user_id,
            role,
            user_profiles!inner(
              id,
              full_name,
              avatar_url
            )
          `
            )
            .eq("document_id", currentDocumentId);

        if (collaboratorsError) {
          console.error("Error fetching collaborators:", collaboratorsError);
          toast({
            title: "Error fetching collaborators",
            description: "Please try again later",
            variant: "destructive",
          });
          return;
        }

        const currentUserId = user?.id; // Get the current user's ID
        const isCurrentUserViewer = collaboratorsData.some(
          (item: any) =>
            item.user_id === currentUserId && item.role === "viewer"
        );

        setIsViewer(isCurrentUserViewer); // Set viewer state based on role

        setCollaborators(
          collaboratorsData.map((item: any) => ({
            id: item.user_id,
            name: item.user_profiles.full_name || "Unknown",
            avatar: item.user_profiles.avatar_url,
            role: item.role,
          }))
        );
      };

      fetchDocumentData();
    }
  }, [currentDocumentId, dispatch, user]);

  //   const { data, error } = await supabase
  //     .from("document_collaborators")
  //     .select(
  //       `
  //       user_id,
  //       role,
  //       user_profiles!inner(
  //         id,
  //         full_name,
  //         avatar_url
  //       )
  //     `
  //     )
  //     .eq("document_id", documentId);

  //   if (error) {
  //     console.error("Error fetching collaborators:", error);
  //     toast({
  //       title: "Error fetching collaborators",
  //       description: "Please try again later",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setCollaborators(
  //     data.map((item: any) => ({
  //       id: item.user_id,
  //       name: item.user_profiles.full_name || "Unknown",
  //       avatar: item.user_profiles.avatar_url,
  //       role: item.role,
  //     }))
  //   );
  // };
  const checkOwnership = useCallback(async () => {
    console.log("Checking ownership:", { user, currentDocumentId });
    if (!user || !currentDocumentId) return;

    const { data, error } = await supabase
      .from("documents")
      .select("user_id")
      .eq("id", currentDocumentId)
      .single();

    if (error) {
      console.error("Error checking document ownership:", error);
      return;
    }

    const newIsOwner = data.user_id === user.id;
    setIsOwner(newIsOwner);
    // setIsViewer(!newIsOwner); // Set viewer state based on ownership
  }, [currentDocumentId, user]);

  useEffect(() => {
    checkOwnership();
  }, [checkOwnership]);

  const exportDocument = async (format: "pdf" | "docx") => {
    if (!currentDocumentId) return;

    const title = "Document"; // Replace with actual document title

    switch (format) {
      case "pdf":
        const docpdf = new jsPDF({
          format: "a4",
          unit: "px",
        });

        docpdf.setFont("Inter-Regular", "normal");
        docpdf.html(generatedDocument, {
          async callback(doc) {
            await doc.save("document");
          },
        });
        break;

      case "docx":
        const htmlToDocx = (html: string) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          return Array.from(doc.body.childNodes).map((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              return new Paragraph({
                children: [new TextRun(node.textContent || "")],
              });
            } else if (node instanceof HTMLElement) {
              const runs: TextRun[] = [];
              let text = node.innerText;
              let isBold =
                node.style.fontWeight === "bold" || node.tagName === "STRONG";
              let isItalic =
                node.style.fontStyle === "italic" || node.tagName === "EM";
              runs.push(new TextRun({ text, bold: isBold, italics: isItalic }));
              return new Paragraph({ children: runs });
            }
            return new Paragraph({ children: [] });
          });
        };

        const docx = new Document({
          sections: [
            {
              properties: {},
              children: htmlToDocx(generatedDocument),
            },
          ],
        });

        const docxBlob = await Packer.toBlob(docx);
        saveAs(docxBlob, `${title}.docx`);
        break;
    }
  };

  const handleUpdate = (newContent: string) => {
    if (currentDocumentId) {
      dispatch({
        type: "SET_GENERATED_DOCUMENT",
        payload: newContent,
      });
      saveDocumentContent(currentDocumentId, newContent);
    }
  };

  // Format text command function
  const formatText = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  // Align text function
  const alignText = useCallback((alignment: string) => {
    document.execCommand(`justify${alignment}`, false, undefined);
    editorRef.current?.focus();
  }, []);

  // Toggle list (ordered/unordered)
  const toggleList = useCallback((listType: "unordered" | "ordered") => {
    const command =
      listType === "unordered" ? "insertUnorderedList" : "insertOrderedList";
    document.execCommand(command, false, undefined);
    editorRef.current?.focus();
  }, []);

  // Format block (heading)
  const formatBlock = useCallback((block: string) => {
    document.execCommand("formatBlock", false, block);
    editorRef.current?.focus();
  }, []);

  // Add a function to get the document title
  const getDocumentTitle = () => {
    const currentDocument = documents.find(
      (doc) => doc.id === currentDocumentId
    );
    return currentDocument ? currentDocument.title : "Untitled Document"; // Fallback title
  };

  return (
    <TooltipProvider>
      <div className='flex h-screen w-full flex-col'>
        <div className='w-full z-10 bg-background h-40'>
          <div className='flex justify-between items-center p-4 border-b'>
            <div className='flex items-center gap-2'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FilePenLine className='h-5 w-5 cursor-pointer' />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Document Title</p>
                </TooltipContent>
              </Tooltip>
              <h2 className='text-lg font-semibold'>{getDocumentTitle()}</h2>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='flex -space-x-2'>
                {collaborators.map((user) => (
                  <Tooltip key={user.id}>
                    <TooltipTrigger>
                      <Avatar className='border-2 border-background w-8 h-8'>
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {user.name} ({user.role})
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              {isOwner && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setIsShareModalOpen(true)}
                >
                  <Share2Icon className='mr-2 h-4 w-4' />
                  Share
                </Button>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='outline'
                            size='sm'
                            disabled={!isActiveSubscription}
                          >
                            Export
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onSelect={() => exportDocument("pdf")}
                          >
                            PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => exportDocument("docx")}
                          >
                            DOCX
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side='bottom' align='end'>
                    {isActiveSubscription
                      ? "Export your document"
                      : "Upgrade to export documents"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className='flex w-full'>
            <Toolbar
              currentHeading='p' // or dynamic state
              onHeadingChange={formatBlock}
              onFormatText={formatText}
              onAlignText={alignText}
              onToggleList={toggleList}
              onFormatBlock={formatBlock}
            />
          </div>
        </div>
        <div className='flex-grow overflow-y-auto justify-between w-full flex'>
          <RichTextEditor
            initialContent={generatedDocument}
            onUpdate={handleUpdate}
            editable={!isViewer} // Disable editor if the user is a viewer
          />
          <div className={`relative ${isCollapsed === false ? "w-1/2" : ""}`}>
            {!isViewer && (
              <AiChat
                isCollapsed={isCollapsed}
                onClose={() => setIsCollapsed(!isCollapsed)}
              />
            )}
          </div>
        </div>
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          documentId={currentDocumentId ?? ""}
        />
      </div>
    </TooltipProvider>
  );
}
