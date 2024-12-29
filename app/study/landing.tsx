"use client";

import { FeatureLanding } from "@/components/landing/featureLanding";
import {
  Book,
  Brain,
  Clock,
  Target,
  BarChart,
  Users,
} from "lucide-react";

export default function StudyLanding() {
  const features = [
    {
      title: "Smart Study Plans",
      description:
        "AI-generated study plans tailored to your learning style and goals.",
      icon: Brain,
    },
    {
      title: "Spaced Repetition",
      description:
        "Optimize your learning with scientifically-proven spaced repetition techniques.",
      icon: Clock,
    },
    {
      title: "Progress Tracking",
      description:
        "Track your learning progress with detailed analytics and insights.",
      icon: Target,
    },
    {
      title: "Interactive Flashcards",
      description:
        "Create and study with AI-enhanced flashcards for better retention.",
      icon: Book,
    },
    {
      title: "Performance Analytics",
      description:
        "Visualize your learning progress and identify areas for improvement.",
      icon: BarChart,
    },
    {
      title: "Study Groups",
      description:
        "Join or create study groups to learn and motivate each other.",
      icon: Users,
    },
  ];

  const testimonials = [
    {
      name: "Alex Thompson",
      role: "Medical Student",
      content:
        "The spaced repetition system has dramatically improved my retention. I'm learning more in less time!",
      avatar: "/avatars/avatar1.png",
    },
    {
      name: "Maria Garcia",
      role: "Language Learner",
      content:
        "The AI-generated study plans have made my language learning journey so much more effective and enjoyable.",
      avatar: "/avatars/avatar2.png",
    },
    {
      name: "James Lee",
      role: "Professional",
      content:
        "Being able to track my progress and see the analytics has kept me motivated throughout my certification prep.",
      avatar: "/avatars/avatar3.png",
    },
  ];

  const pricing = [
    {
      name: "Student",
      price: "Free",
      description: "Perfect for individual learners",
      features: [
        "Basic study plans",
        "100 flashcards",
        "Basic analytics",
        "Personal progress tracking",
      ],
      cta: "Start Learning",
      href: "/study",
    },
    {
      name: "Scholar",
      price: "$9",
      description: "For dedicated learners",
      features: [
        "AI study plans",
        "Unlimited flashcards",
        "Advanced analytics",
        "Study groups",
        "Spaced repetition",
        "Priority support",
      ],
      cta: "Upgrade Now",
      href: "/pricing",
      popular: true,
    },
    {
      name: "Institution",
      price: "$25",
      description: "For schools and organizations",
      features: [
        "Everything in Scholar",
        "Custom branding",
        "Admin dashboard",
        "Progress reports",
        "API access",
        "Dedicated support",
      ],
      cta: "Contact Sales",
      href: "/contact",
    },
  ];

  return (
    <FeatureLanding
      title="Study Smarter, Not Harder"
      subtitle="AI-Enhanced Learning Platform"
      description="Maximize your learning potential with personalized study plans, spaced repetition, and powerful analytics. Perfect for students, professionals, and lifelong learners."
      features={features}
      testimonials={testimonials}
      pricing={pricing}
      demoImage="/study-demo.png"
      primaryCTA="Start Learning"
      secondaryCTA="Take Tour"
      primaryCTALink="/study"
      secondaryCTALink="#demo"
    />
  );
}
