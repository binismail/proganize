import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles } from "lucide-react";
import { HOLIDAY_PROMOTIONS } from "@/utils/constants";
import { PromotionCard } from "@/components/dashboard/PromotionCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export function WelcomePopup({ isOpen, onClose, userName }: WelcomePopupProps) {
  const [api, setApi] = React.useState<any>();

  React.useEffect(() => {
    if (!api) return;

    const autoplayInterval = setInterval(() => {
      api.scrollNext();
    }, 4000);

    return () => clearInterval(autoplayInterval);
  }, [api]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-2xl'>
            <Gift className='h-6 w-6 text-red-500' />
            Welcome to Proganize{userName ? `, ${userName}` : ""}!
          </DialogTitle>
          <DialogDescription className='text-lg'>
            We're excited to have you here! To get you started, we've added{" "}
            <span className='font-bold text-primary'>1,000 free credits</span>{" "}
            to your account.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          <div className='rounded-lg bg-secondary/50 p-4'>
            <div className='flex items-center gap-2 text-sm'>
              <Sparkles className='h-4 w-4' />
              Here's what you can do with your credits:
            </div>
            <ul className='mt-2 space-y-2 text-sm'>
              <li>• Generate professional documents</li>
              <li>• Create compelling content</li>
              <li>• Get AI-powered assistance</li>
            </ul>
          </div>

          <div className='space-y-4'>
            <h3 className='flex items-center gap-2 font-semibold'>
              <Gift className='h-4 w-4 text-red-500' />
              Special Holiday Offers
            </h3>
            <Carousel
              opts={{
                align: "center",
                loop: true,
              }}
              className='w-full'
              setApi={setApi}
            >
              <CarouselContent>
                {HOLIDAY_PROMOTIONS.map((promo, index) => (
                  <CarouselItem key={index} className='basis-full'>
                    <div className='p-1'>
                      <PromotionCard {...promo} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className='hidden sm:block'>
                <CarouselPrevious />
                <CarouselNext />
              </div>
            </Carousel>
          </div>

          <div className='flex justify-end gap-2'>
            <Button onClick={onClose}>Get Started</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
