import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface PromotionCardProps {
  title: string;
  description: string;
  price: number;
  credits: number;
  onPurchase: () => void;
  isSpecialOffer?: boolean;
}

export function PromotionCard({
  title,
  description,
  price,
  credits,
  onPurchase,
  isSpecialOffer = false,
}: PromotionCardProps) {
  return (
    <Card
      className={isSpecialOffer ? "border-blue-500 dark:border-blue-400" : ""}
    >
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              {title}
              {isSpecialOffer && (
                <span className='flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-normal text-blue-600 dark:bg-blue-900 dark:text-blue-300'>
                  <Sparkles className='h-3 w-3' />
                  Special Offer
                </span>
              )}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='flex items-baseline justify-between'>
          <div className='flex items-baseline gap-1'>
            <span className='text-3xl font-bold'>${price}</span>
            <span className='text-sm text-muted-foreground'>one-time</span>
          </div>
          <div className='text-right'>
            <div className='text-2xl font-bold'>{credits.toLocaleString()}</div>
            <div className='text-sm text-muted-foreground'>AI words</div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className='w-full'
          onClick={onPurchase}
          variant={isSpecialOffer ? "default" : "outline"}
        >
          Purchase Credits
        </Button>
      </CardFooter>
    </Card>
  );
}
