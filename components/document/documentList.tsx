"use client";
import { useAppContext } from "@/app/context/appContext";
import { parseISO, isToday, isYesterday, isThisWeek, format } from "date-fns";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { signIn } from "@/utils/supabaseOperations";
import { Badge } from "../ui/badge";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  title: string;
  updated_at?: string;
  created_at: string;
  user_id: string;
  content?: string;
}

interface GroupedDocuments {
  [key: string]: Document[];
}

export default function DocumentList() {
  const { state, dispatch } = useAppContext();
  const { documents, user, isLoading } = state;
  const router = useRouter();

  const groupDocuments = (docs: Document[]): GroupedDocuments => {
    return docs.reduce((groups: GroupedDocuments, doc) => {
      const date = parseISO(doc.updated_at || doc.created_at);
      let group = "Older";

      if (isToday(date)) {
        group = "Today";
      } else if (isYesterday(date)) {
        group = "Yesterday";
      } else if (isThisWeek(date)) {
        group = "This Week";
      }

      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(doc);
      return groups;
    }, {});
  };

  const handleDocumentClick = (doc: Document) => {
    dispatch({ type: "SET_SHOW_INITIAL_CONTENT", payload: false });
    dispatch({ type: "SET_CURRENT_DOCUMENT_ID", payload: doc.id });
    dispatch({ type: "SET_GENERATED_DOCUMENT", payload: doc.content || "" });
    dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: true });
  };

  if (!user) {
    return (
      <div className='p-4 space-y-4'>
        <div className='text-center space-y-2'>
          <p className='text-sm text-muted-foreground'>
            Sign in to view your documents
          </p>
          <Button onClick={() => signIn()} variant='default' size='sm'>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='p-4 space-y-4'>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className='h-16 w-full' />
        ))}
      </div>
    );
  }

  const groupedDocuments = groupDocuments(documents || []);
  const groups = ["Today", "Yesterday", "This Week", "Older"];

  return (
    <div className='p-2 space-y-4'>
      {groups.map((group) => {
        const docs = groupedDocuments[group];
        if (!docs?.length) return null;

        return (
          <div key={group} className='space-y-2'>
            <h3 className='text-sm font-medium text-muted-foreground px-2'>
              {group}
            </h3>
            <div className='space-y-1'>
              {docs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleDocumentClick(doc)}
                  className={cn(
                    "w-full text-left px-2 py-2 rounded-lg hover:bg-muted",
                    "transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  )}
                >
                  <div className='flex justify-between items-start'>
                    <div className='space-y-1'>
                      <p className='text-sm font-medium line-clamp-1'>
                        {doc.title || "Untitled"}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {format(
                          parseISO(doc.updated_at || doc.created_at),
                          "MMM d, h:mm a"
                        )}
                      </p>
                    </div>
                    {doc.content && (
                      <Badge variant='secondary' className='text-xs'>
                        {doc.content.length.toLocaleString()} chars
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {!documents?.length && (
        <div className='text-center p-4'>
          <p className='text-sm text-muted-foreground'>No documents yet</p>
        </div>
      )}
    </div>
  );
}
