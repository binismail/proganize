import { useAppContext } from "@/app/context/appContext";
import { createClient } from "@supabase/supabase-js";
import * as Popover from "@radix-ui/react-popover";
import { MoreHorizontal, Download, Share2, Edit2, Trash2 } from "lucide-react";
import { supabase } from "@/utils/supabase/instance";
import { useToast } from "@/hooks/use-toast";
import { doc } from "prettier";

interface Document {
  id: string;
  title: string;
  updated_at?: string;
  created_at: string;
  // Add other properties as needed
}

export default function DocumentItem({ document }: { document: Document }) {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const { documents, selectedDocument, isRenaming, newTitle } = state;

  const handleDocumentClick = (document: any) => {
    console.log(document);
    dispatch({ type: "SET_SELECTED_DOCUMENT", payload: document });
    dispatch({ type: "SET_PRODUCT_IDEA", payload: "" });
    dispatch({
      type: "SET_CONVERSATION",
      payload: document.conversation,
    });
    dispatch({
      type: "SET_HAS_GENERATION_STARTED",
      payload: true,
    });
    if (document.content === "<p></p>") {
      console.log("hi", document.content);
      dispatch({
        type: "SET_GENERATED_DOCUMENT",
        payload: document.content,
      });
      dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: true });
    } else {
      console.log("hello");
      dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: false });
    }

    dispatch({ type: "SET_CURRENT_DOCUMENT_ID", payload: document.id });
    dispatch({ type: "SET_SHOW_INITIAL_CONTENT", payload: false });
  };

  const handleDownload = (doc: Document) => {
    console.log("Downloading", doc.title);
  };

  const handleShare = (doc: Document) => {
    console.log("Sharing", doc.title);
  };

  const handleRename = async (doc: Document) => {
    if (isRenaming) {
      try {
        const { error } = await supabase
          .from("documents")
          .update({ title: newTitle })
          .eq("id", doc.id);

        if (error) throw error;

        // Update local state
        dispatch({
          type: "SET_DOCUMENTS",
          payload: documents.map((d) =>
            d.id === doc.id ? { ...d, title: newTitle } : d
          ),
        });

        dispatch({ type: "SET_IS_RENAMING", payload: false });
        toast({
          description: "Document renamed successfully",
        });
      } catch (error) {
        console.error("Error renaming document:", error);
      }
    } else {
      dispatch({ type: "SET_NEW_TITLE", payload: doc.title });
      dispatch({ type: "SET_IS_RENAMING", payload: true });
    }
  };

  const truncateString = (string = "", maxLength = 30) =>
    string.length > maxLength ? `${string.substring(0, maxLength)}…` : string;

  const handleDelete = async (doc: Document) => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      // Update local state
      dispatch({
        type: "SET_DOCUMENTS",
        payload: documents.filter((d) => d.id !== doc.id),
      });
      toast({
        description: "Document deleted successfully",
        variant: "default",
      });
      if (selectedDocument && selectedDocument.id === doc.id) {
        dispatch({ type: "SET_SELECTED_DOCUMENT", payload: null });
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        description: "Error deleting document",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      key={document.id}
      className={`
                          cursor-pointer
                          ml-2
                          p-2 rounded-lg
                          transition-colors
                          gap-2
                          text-sm
                          duration-200
                          hover:bg-accent
                          hover:text-accent-foreground
                          group
                          flex
                          justify-between
                          items-center
                          ${
                            selectedDocument &&
                            selectedDocument.id === document.id
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground"
                          }
                        `}
      onClick={() => handleDocumentClick(document)}
    >
      {isRenaming && selectedDocument && selectedDocument.id === document.id ? (
        <input
          type='text'
          value={newTitle}
          onChange={(e) =>
            dispatch({
              type: "SET_NEW_TITLE",
              payload: e.target.value,
            })
          }
          onBlur={() => handleRename(document)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleRename(document);
            }
          }}
          className='bg-transparent border-none focus:outline-none'
          autoFocus
        />
      ) : (
        <span className='truncate flex-1 mr-2 overflow-hidden whitespace-nowrap text-ellipsis'>
          {truncateString(document.title)}
        </span>
      )}
      <Popover.Root>
        <Popover.Trigger asChild>
          <button className='opacity-0 group-hover:opacity-100 transition-opacity'>
            <MoreHorizontal size={16} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className='bg-background border rounded-md p-2'>
            <div className='flex flex-col space-y-2'>
              <button
                className='flex items-center space-x-2 hover:bg-accent hover:text-accent-foreground rounded px-2 py-1'
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(document);
                }}
              >
                <Download size={16} />
                <span>Download</span>
              </button>
              <button
                className='flex items-center space-x-2 hover:bg-accent hover:text-accent-foreground rounded px-2 py-1'
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(document);
                }}
              >
                <Share2 size={16} />
                <span>Share</span>
              </button>
              <button
                className='flex items-center space-x-2 hover:bg-accent hover:text-accent-foreground rounded px-2 py-1'
                onClick={(e) => {
                  e.stopPropagation();
                  handleRename(document);
                }}
              >
                <Edit2 size={16} />
                <span>Rename</span>
              </button>
              <button
                className='flex items-center space-x-2 hover:bg-accent hover:text-accent-foreground rounded px-2 py-1'
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(document);
                }}
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
