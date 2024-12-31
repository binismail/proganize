import { Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className='flex items-center justify-center min-h-[60vh]'>
      <Card className='p-8 max-w-md w-full text-center space-y-4'>
        <div className='flex justify-center'>
          <div className='bg-blue-100 p-3 rounded-full'>
            <Rocket className='w-8 h-8 text-blue-600' />
          </div>
        </div>
        <h1 className='text-2xl font-bold'>{title}</h1>
        <p className='text-muted-foreground'>{description}</p>
        <div className='pt-4'>
          <div className='bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-md inline-flex items-center space-x-2'>
            <span>Coming Soon</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
