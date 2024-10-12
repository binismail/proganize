import {
  LucideBadgeDollarSign,
  LucideBookTemplate,
  LucideFile,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className='row-start-3 flex gap-6 flex-wrap items-center justify-center py-10 border-b'>
      <Link
        className='flex items-center gap-2 hover:underline hover:underline-offset-4'
        href='/privacy-terms'
        target='_blank'
        rel='noopener noreferrer'
      >
        <LucideFile width={16} height={16} />
        Privacy & Terms
      </Link>
      <Link
        className='flex items-center gap-2 hover:underline hover:underline-offset-4'
        href='/templates'
        target='_blank'
        rel='noopener noreferrer'
      >
        <LucideBookTemplate width={16} height={16} />
        Templates
      </Link>
      <Link
        className='flex items-center gap-2 hover:underline hover:underline-offset-4'
        href='/pricing'
        target='_blank'
        rel='noopener noreferrer'
      >
        <LucideBadgeDollarSign width={16} height={16} />
        Pricing
      </Link>
    </footer>
  );
}
