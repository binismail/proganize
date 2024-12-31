"use client";

import { FeatureLanding } from "@/components/landing/featureLanding";
import {
  Bot,
  FileText,
  Sparkles,
  PenTool,
  Share2,
  History,
} from "lucide-react";

export default function WriteLanding() {
  const features = [
    {
      title: "AI-Powered Writing",
      description:
        "Leverage advanced AI to enhance your writing, generate ideas, and overcome writer's block.",
      icon: Bot,
    },
    {
      title: "Smart Templates",
      description:
        "Choose from a variety of professionally crafted templates to jumpstart your writing.",
      icon: FileText,
    },
    {
      title: "Real-time Collaboration",
      description:
        "Work together with team members in real-time with seamless collaboration features.",
      icon: Share2,
    },
    {
      title: "Intelligent Suggestions",
      description:
        "Get smart suggestions for improving your writing style, grammar, and clarity.",
      icon: Sparkles,
    },
    {
      title: "Distraction-free Editor",
      description:
        "Focus on your writing with our clean, minimalist editor designed for productivity.",
      icon: PenTool,
    },
    {
      title: "Version History",
      description:
        "Track changes and restore previous versions of your documents with ease.",
      icon: History,
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Content Creator",
      content:
        "The AI-powered writing assistant has completely transformed my content creation process. I'm now twice as productive!",
      avatar: "/avatars/avatar1.png",
    },
    {
      name: "Michael Chen",
      role: "Technical Writer",
      content:
        "The templates and collaboration features have made it so much easier to work with my team. Best writing tool I've used.",
      avatar: "/avatars/avatar2.png",
    },
    {
      name: "Emma Davis",
      role: "Student",
      content:
        "As a student, the intelligent suggestions have helped improve my writing significantly. It's like having a writing tutor 24/7.",
      avatar: "/avatars/avatar3.png",
    },
  ];

  const pricing = [
    {
      name: "Free",
      price: "Free",
      description: "Perfect for trying out our features",
      features: [
        "Basic writing tools",
        "3 templates",
        "500 AI credits/month",
        "1 collaborator",
      ],
      cta: "Get Started",
      href: "/write",
    },
    {
      name: "Pro",
      price: "$12",
      description: "Everything you need for professional writing",
      features: [
        "Advanced writing tools",
        "Unlimited templates",
        "5,000 AI credits/month",
        "Unlimited collaborators",
        "Version history",
        "Priority support",
      ],
      cta: "Upgrade to Pro",
      href: "/pricing",
      popular: true,
    },
    {
      name: "Team",
      price: "$29",
      description: "For teams that write together",
      features: [
        "Everything in Pro",
        "15,000 AI credits/month",
        "Team analytics",
        "Admin controls",
        "Custom templates",
        "API access",
      ],
      cta: "Contact Sales",
      href: "/contact",
    },
  ];

  return (
    <FeatureLanding
      title="Write Better, Faster, Together"
      subtitle="AI-Powered Writing Assistant"
      description="Transform your writing process with our intelligent AI assistant, professional templates, and collaborative tools. Whether you're writing articles, documentation, or creative content, we've got you covered."
      features={features}
      testimonials={testimonials}
      pricing={pricing}
      demoImage="/demo-write.png"
      primaryCTA="Start Writing"
      secondaryCTA="Watch Demo"
      primaryCTALink="/write"
      secondaryCTALink="#demo"
    />
  );
}
