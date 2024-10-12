"use client";

import { useAppContext } from "@/app/context/appContext";
import { useEffect, useCallback, useRef, useState } from "react";
import { supabase } from "@/utils/supabase/instance";
import { useEditor, EditorContent } from "@tiptap/react";
import debounce from "lodash/debounce";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Code from "@tiptap/extension-code";
import Link from "@tiptap/extension-link";
import {
  BetweenVerticalEnd,
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  List,
  ListOrderedIcon,
  Share2Icon,
  UsersIcon,
  EyeIcon,
  EditIcon,
} from "lucide-react";
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
import { Markdown } from "tiptap-markdown";

export default function EnhancedEditor() {
  const { state, dispatch } = useAppContext();
  const {
    generatedDocument,
    currentDocumentId,
    documentUpdated,
    user,
    subscriptionStatus,
  } = state;
  const { toast } = useToast();
  const [collaborators, setCollaborators] = useState<
    { id: string; name: string; avatar: string; role: string }[]
  >([]);
  const [editorWidth, setEditorWidth] = useState("50%");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const isActiveSubscription = subscriptionStatus === "active";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Markdown,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      Bold,
      Italic,
      Strike,
      Code,
      Link.configure({ openOnClick: false }),
    ],
    content: generatedDocument,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      if (currentDocumentId) {
        saveDocumentContent(currentDocumentId, content);
      }
    },
    onCreate: ({ editor }) => {
      console.log("Editor created", editor);
    },
  });

  useEffect(() => {
    if (editor) {
      console.log("Editor initialized", editor);
    }
  }, [editor]);

  const saveDocumentContent = useCallback(
    debounce(async (documentId: string, content: string) => {
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
        toast({
          title: "Document saved",
          description: "Your document has been saved",
          variant: "default",
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
          if (payload.new.content !== editor?.getHTML()) {
            dispatch({
              type: "SET_GENERATED_DOCUMENT",
              payload: payload.new.content,
            });
            editor?.commands.setContent(payload.new.content);
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
  }, [currentDocumentId, dispatch, editor]);

  useEffect(() => {
    if (editor && generatedDocument) {
      editor.commands.setContent(generatedDocument);
      dispatch({ type: "SET_DOCUMENT_UPDATED", payload: false });
    }
  }, [generatedDocument, editor, documentUpdated, dispatch]);

  useEffect(() => {
    if (currentDocumentId) {
      fetchCollaborators(currentDocumentId);
    }
  }, [currentDocumentId]);

  const fetchCollaborators = async (documentId: string) => {
    const { data, error } = await supabase
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
      .eq("document_id", documentId);

    if (error) {
      console.error("Error fetching collaborators:", error);
      toast({
        title: "Error fetching collaborators",
        description: "Please try again later",
        variant: "destructive",
      });
      return;
    }

    setCollaborators(
      data.map((item: any) => ({
        id: item.user_id,
        name: item.user_profiles.full_name || "Unknown",
        avatar: item.user_profiles.avatar_url,
        role: item.role,
      }))
    );
  };

  const handleResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = parseInt(editorWidth);

    const handleMouseMove = (e: MouseEvent) => {
      const diff = startX - e.clientX; // Changed: reversed the subtraction
      const newWidth = Math.max(200, startWidth + diff);
      setEditorWidth(`${newWidth}px`);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const toggleHeading = useCallback(
    (level: 1 | 2) => {
      if (editor) {
        editor.chain().focus().toggleHeading({ level }).run();
        console.log(`Toggled heading level ${level}`);
      } else {
        console.log("Editor not available");
      }
    },
    [editor]
  );

  const toggleList = useCallback(
    (listType: "bullet" | "ordered") => {
      if (editor) {
        if (listType === "bullet") {
          editor.chain().focus().toggleBulletList().run();
        } else {
          editor.chain().focus().toggleOrderedList().run();
        }
        console.log(`Toggled ${listType} list`);
      } else {
        console.log("Editor not available");
      }
    },
    [editor]
  );

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
    console.log("Ownership check result:", {
      newIsOwner,
      documentUserId: data.user_id,
      currentUserId: user.id,
    });
    setIsOwner(newIsOwner);
  }, [currentDocumentId, user]);

  useEffect(() => {
    checkOwnership();
  }, [checkOwnership]);

  const exportDocument = async (format: "pdf" | "docx") => {
    if (!editor || !currentDocumentId) return;

    const content = editor.getHTML();
    const title = "Document"; // Replace with actual document title

    switch (format) {
      case "pdf":
        const docpdf = new jsPDF({
          format: "a4",
          unit: "px",
        });

        docpdf.setFont("Inter-Regular", "normal");
        docpdf.html(content, {
          async callback(doc) {
            await doc.save("document");
          },
        });
        break;

      case "docx":
        const doc = new Document({
          sections: [
            {
              properties: {},
              children: [
                new Paragraph({
                  children: [new TextRun({ text: content, bold: true })],
                }),
              ],
            },
          ],
        });

        // Convert HTML to DOCX
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
              children: htmlToDocx(content),
            },
          ],
        });

        const docxBlob = await Packer.toBlob(docx);
        saveAs(docxBlob, `${title}.docx`);
        break;
    }
  };

  return (
    <TooltipProvider>
      <div className='flex h-screen w-full'>
        {/* Resizable divider */}
        <div
          className='w-[4px] h-4 bg-black cursor-ew-resize hover:bg-gray-300 transition-colors'
          onMouseDown={handleResize}
        ></div>

        {/* Editor content */}
        <div
          className='flex-grow overflow-y-auto border-l'
          style={{ width: editorWidth }}
        >
          <div className='flex flex-col h-full'>
            {/* Fixed header */}
            <div className='sticky top-0 z-10 bg-background'>
              <div className='flex justify-between items-center p-4 border-b'>
                <div className='flex items-center gap-2'>
                  <BetweenVerticalEnd className='h-5 w-5' />
                  <h2 className='text-lg font-semibold'>Generated document</h2>
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
                          {" "}
                          {/* Wrap in span to allow tooltip on disabled button */}
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
              <div className='border-b'>
                <div className='flex items-center space-x-1 p-1'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='sm' className='h-8 px-2'>
                        Text
                        <UsersIcon className='ml-2 h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onSelect={() =>
                          editor?.chain().focus().toggleBold().run()
                        }
                      >
                        <BoldIcon className='mr-2 h-4 w-4' /> Bold
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          editor?.chain().focus().toggleItalic().run()
                        }
                      >
                        <ItalicIcon className='mr-2 h-4 w-4' /> Italic
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          editor?.chain().focus().toggleStrike().run()
                        }
                      >
                        <StrikethroughIcon className='mr-2 h-4 w-4' /> Strike
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          editor?.chain().focus().toggleCode().run()
                        }
                      >
                        <CodeIcon className='mr-2 h-4 w-4' /> Code
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 px-2'
                    onClick={() => toggleHeading(1)}
                  >
                    <Heading1Icon className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 px-2'
                    onClick={() => toggleHeading(2)}
                  >
                    <Heading2Icon className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 px-2'
                    onClick={() => toggleList("bullet")}
                  >
                    <List className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 px-2'
                    onClick={() => toggleList("ordered")}
                  >
                    <ListOrderedIcon className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>

            {/* Scrollable editor content */}
            <div className='flex-grow overflow-y-auto'>
              <EditorContent
                editor={editor}
                className='p-4 focus:outline-none dark:prose-invert max-w-none h-full outline-none'
              />
            </div>
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
