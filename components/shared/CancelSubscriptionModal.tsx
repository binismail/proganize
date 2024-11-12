// components/CancelSubscriptionModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
}

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  onCancel,
}: CancelSubscriptionModalProps) {
  const [feedback, setFeedback] = useState("");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Plan</DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <p>Sorry to see you go :(</p>
          <textarea
            placeholder='Share your feedback here...'
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className='w-full p-2 border rounded'
          />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Stay Subscribed
          </Button>
          <Button variant='destructive' onClick={onCancel}>
            Yes, Cancel It
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
