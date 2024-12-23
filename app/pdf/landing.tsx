"use client";

import { FeatureLanding } from "@/components/landing/featureLanding";
import {
  FileText,
  Search,
  BookOpen,
  MessageSquare,
  Zap,
  Download,
} from "lucide-react";

export default function PDFLanding() {
  const features = [
    {
      title: "Smart PDF Analysis",
      description:
        "Extract key insights and summaries from your PDFs using advanced AI technology.",
      icon: Search,
    },
    {
      title: "Interactive Reading",
      description:
        "Highlight, annotate, and add comments to your PDFs with our intuitive interface.",
      icon: BookOpen,
    },
    {
      title: "AI Q&A",
      description:
        "Ask questions about your documents and get instant, accurate answers powered by AI.",
      icon: MessageSquare,
    },
    {
      title: "Quick Processing",
      description:
        "Process large PDFs in seconds with our optimized processing engine.",
      icon: Zap,
    },
    {
      title: "Document Management",
      description:
        "Organize your PDFs with smart folders, tags, and powerful search capabilities.",
      icon: FileText,
    },
    {
      title: "Export & Share",
      description:
        "Export annotations, summaries, and insights in multiple formats for easy sharing.",
      icon: Download,
    },
  ];

  const testimonials = [
    {
      name: "David Wilson",
      role: "Researcher",
      content:
        "The AI-powered PDF analysis has saved me countless hours of reading and note-taking. It's an essential tool for my research.",
      avatar: "/avatars/avatar1.png",
    },
    {
      name: "Lisa Zhang",
      role: "Student",
      content:
        "Being able to ask questions about my textbooks and get instant answers has revolutionized my study process.",
      avatar: "/avatars/avatar2.png",
    },
    {
      name: "Robert Brown",
      role: "Business Analyst",
      content:
        "The document management and quick processing features have made handling large volumes of PDFs effortless.",
      avatar: "/avatars/avatar3.png",
    },
  ];

  const pricing = [
    {
      name: "Basic",
      price: "Free",
      description: "For casual PDF users",
      features: [
        "5 PDFs per month",
        "Basic analysis",
        "Highlighting & notes",
        "Export to text",
      ],
      cta: "Start Free",
      href: "/pdf",
    },
    {
      name: "Pro",
      price: "$15",
      description: "For power users and professionals",
      features: [
        "Unlimited PDFs",
        "Advanced AI analysis",
        "Q&A feature",
        "All export formats",
        "Priority processing",
        "Cloud storage",
      ],
      cta: "Go Pro",
      href: "/pricing",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$39",
      description: "For teams and organizations",
      features: [
        "Everything in Pro",
        "Team collaboration",
        "Admin dashboard",
        "API access",
        "Custom integration",
        "24/7 support",
      ],
      cta: "Contact Sales",
      href: "/contact",
    },
  ];

  return (
    <FeatureLanding
      title="Transform Your PDF Experience"
      subtitle="AI-Powered PDF Analysis & Management"
      description="Unlock the power of your PDFs with intelligent analysis, interactive reading, and AI-powered insights. Perfect for researchers, students, and professionals."
      features={features}
      testimonials={testimonials}
      pricing={pricing}
      demoVideo="/pdf-demo.mp4"
      primaryCTA="Analyze PDF"
      secondaryCTA="Learn More"
      primaryCTALink="/pdf/upload"
      secondaryCTALink="#features"
    />
  );
}
