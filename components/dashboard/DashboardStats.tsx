import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppContext } from "@/app/context/appContext";
import { CircleIcon, StarIcon } from "lucide-react";

interface DashboardStatsProps {
  credits: number;
  documentsCount: number;
  studyGuidesCount: number;
  pdfConversationsCount: number;
}

export function DashboardStats({
  credits,
  documentsCount,
  studyGuidesCount,
  pdfConversationsCount,
}: DashboardStatsProps) {
  const { state } = useAppContext();
  const { isLoading } = state;

  const LoadingSkeleton = () => (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              <Skeleton className='h-4 w-[100px]' />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              <Skeleton className='h-8 w-[60px]' />
            </div>
            <div className='text-xs text-muted-foreground mt-2'>
              <Skeleton className='h-3 w-[120px]' />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Available Credits
          </CardTitle>
          <StarIcon className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{credits.toLocaleString()}</div>
          <p className='text-xs text-muted-foreground'>AI words remaining</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Documents</CardTitle>
          <CircleIcon className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{documentsCount}</div>
          <p className='text-xs text-muted-foreground'>
            Total documents created
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Study Guides</CardTitle>
          <CircleIcon className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{studyGuidesCount}</div>
          <p className='text-xs text-muted-foreground'>
            AI-generated study materials
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            PDF Conversations
          </CardTitle>
          <CircleIcon className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{pdfConversationsCount}</div>
          <p className='text-xs text-muted-foreground'>Active PDF chats</p>
        </CardContent>
      </Card>
    </div>
  );
}
