import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, MessageSquare, Book } from "lucide-react";
import { useAppContext } from "@/app/context/appContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/instance";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentItem {
  id: string;
  title: string;
  content?: string;
  type: "document" | "pdf" | "study";
  createdAt: string;
  preview?: string;
}

interface RecentItemsProps {
  items: RecentItem[];
  title: string;
  description: string;
}

export function RecentItems({ items, title, description }: RecentItemsProps) {
  const { dispatch, state } = useAppContext();
  const { isLoading } = state;
  const router = useRouter();

  const getIcon = (type: RecentItem["type"]) => {
    switch (type) {
      case "document":
        return <FileText className='h-4 w-4' />;
      case "pdf":
        return <MessageSquare className='h-4 w-4' />;
      case "study":
        return <Book className='h-4 w-4' />;
    }
  };

  const handleItemClick = async (item: RecentItem) => {
    switch (item.type) {
      case "document":
        dispatch({ type: "SET_CURRENT_DOCUMENT_ID", payload: item.id });
        dispatch({
          type: "SET_GENERATED_DOCUMENT",
          payload: item.content || "",
        });
        dispatch({ type: "SET_SHOW_INITIAL_CONTENT", payload: false });
        dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: true });
        router.push("/write");
        break;

      case "pdf":
        try {
          const { data: pdfConversation, error } = await supabase
            .from("pdf_conversations")
            .select("*")
            .eq("id", item.id)
            .single();

          if (error) throw error;
          if (!pdfConversation) throw new Error("PDF conversation not found");

          dispatch({
            type: "SET_CURRENT_PDF_CONVERSATION",
            payload: pdfConversation,
          });
          router.push("/pdf");
        } catch (error) {
          console.error("Error fetching PDF conversation:", error);
        }
        break;

      case "study":
        try {
          const { data: studyMaterial, error } = await supabase
            .from("study_materials")
            .select("*")
            .eq("id", item.id)
            .single();

          if (error) throw error;
          if (!studyMaterial) throw new Error("Study material not found");

          dispatch({
            type: "SET_CURRENT_STUDY_MATERIAL",
            payload: studyMaterial,
          });
          router.push("/study");
        } catch (error) {
          console.error("Error fetching study material:", error);
        }
        break;
    }
  };

  const LoadingSkeleton = () => (
    <div className='space-y-4'>
      {[1, 2, 3].map((i) => (
        <div key={i} className='flex items-center space-x-4 rounded-lg border p-4'>
          <Skeleton className='h-10 w-10 rounded-full' />
          <div className='space-y-2 flex-1'>
            <Skeleton className='h-4 w-[200px]' />
            <Skeleton className='h-3 w-[160px]' />
            <Skeleton className='h-3 w-[100px]' />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card className='col-span-3'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className='h-[300px] pr-4'>
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className='space-y-4'>
              {items.map((item) => (
                <button
                  key={item.id}
                  className='w-full text-left'
                  onClick={() => handleItemClick(item)}
                >
                  <div className='flex items-center space-x-4 rounded-lg border p-4 hover:bg-accent transition-colors'>
                    <div className='rounded-full bg-background p-2 ring-1 ring-border'>
                      {getIcon(item.type)}
                    </div>
                    <div className='flex-1 space-y-1'>
                      <p className='font-medium'>{item.title}</p>
                      {item.preview && (
                        <p className='text-sm text-muted-foreground line-clamp-2'>
                          {item.preview}
                        </p>
                      )}
                      <p className='text-xs text-muted-foreground'>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
