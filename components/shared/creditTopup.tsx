import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const WORD_RATE = 0.001; // $0.001 per AI word

export function CreditTopup() {
  const [amount, setAmount] = useState<string>("");
  const [wordCount, setWordCount] = useState<number>(0);

  useEffect(() => {
    // Calculate words when amount changes
    const numericAmount = parseFloat(amount) || 0;
    const words = Math.floor(numericAmount / WORD_RATE);
    setWordCount(words);
  }, [amount]);

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimals
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <Card className='p-6'>
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Top Up Credits</h2>
        <p className='text-sm text-muted-foreground'>
          1 AI word = ${WORD_RATE.toFixed(3)}
        </p>

        <div className='flex items-center gap-4'>
          <div className='flex-1'>
            <label htmlFor='amount' className='text-sm font-medium mb-2 block'>
              Amount (USD)
            </label>
            <div className='relative'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2'>
                $
              </span>
              <Input
                id='amount'
                type='text'
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className='pl-8'
                placeholder='Enter amount'
              />
            </div>
          </div>

          <div className='flex-1'>
            <label className='text-sm font-medium mb-2 block'>
              AI Words You'll Get
            </label>
            <div className='h-10 flex items-center'>
              <span className='text-lg font-semibold'>
                {wordCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <Button className='w-full' size='lg' variant={"outline"}>
          Purchase Credits
        </Button>
      </div>
    </Card>
  );
}
