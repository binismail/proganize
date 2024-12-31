"use client";

import { Button } from "@/components/ui/button";
import { CreditDisplay } from "@/components/shared/creditDisplay";
import { ArrowRight, CheckCircle2, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar: string;
}

interface Feature {
  title: string;
  description: string;
  icon: any;
}

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  popular?: boolean;
}

interface FeatureLandingProps {
  title: string;
  subtitle: string;
  description: string;
  features: Feature[];
  testimonials: Testimonial[];
  pricing: PricingTier[];
  demoVideo?: string;
  demoImage?: string;
  primaryCTA: string;
  secondaryCTA: string;
  primaryCTALink: string;
  secondaryCTALink: string;
}

export function FeatureLanding({
  title,
  subtitle,
  description,
  features,
  testimonials,
  pricing,
  demoVideo,
  demoImage,
  primaryCTA,
  secondaryCTA,
  primaryCTALink,
  secondaryCTALink,
}: FeatureLandingProps) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container px-4 mx-auto">
          <div className="flex flex-wrap items-center -mx-4">
            <div className="w-full lg:w-1/2 px-4 mb-12 lg:mb-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-lg"
              >
                <h1 className="text-4xl sm:text-5xl font-bold mb-5">{title}</h1>
                <h2 className="text-2xl text-muted-foreground mb-5">{subtitle}</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  {description}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" asChild>
                    <Link href={primaryCTALink}>
                      {primaryCTA}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href={secondaryCTALink}>{secondaryCTA}</Link>
                  </Button>
                </div>
              </motion.div>
            </div>
            <div className="w-full lg:w-1/2 px-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                {demoVideo ? (
                  <video
                    className="w-full rounded-lg shadow-2xl"
                    autoPlay
                    loop
                    muted
                    playsInline
                  >
                    <source src={demoVideo} type="video/mp4" />
                  </video>
                ) : demoImage ? (
                  <Image
                    src={demoImage}
                    alt="Demo"
                    width={600}
                    height={400}
                    className="w-full rounded-lg shadow-2xl"
                  />
                ) : null}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4 mx-auto">
          <div className="max-w-xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to supercharge your productivity
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="p-6 bg-background rounded-lg shadow-lg"
              >
                <feature.icon className="h-10 w-10 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container px-4 mx-auto">
          <div className="max-w-xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Users Say</h2>
            <p className="text-lg text-muted-foreground">
              Don't just take our word for it
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="p-6 bg-muted rounded-lg"
              >
                <div className="flex items-center mb-4">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div className="ml-4">
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground">{testimonial.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4 mx-auto">
          <div className="max-w-xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground">
              Choose the plan that's right for you
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pricing.map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`p-6 rounded-lg ${
                  tier.popular
                    ? "bg-primary text-primary-foreground ring-2 ring-primary"
                    : "bg-background"
                }`}
              >
                {tier.popular && (
                  <div className="mb-4">
                    <span className="px-3 py-1 text-xs font-semibold bg-primary-foreground text-primary rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  {tier.price !== "Free" && <span>/month</span>}
                </div>
                <p className="mb-6 text-sm">{tier.description}</p>
                <ul className="mb-6 space-y-2">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={tier.popular ? "secondary" : "default"}
                  asChild
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of users who are already using our platform
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href={primaryCTALink}>
                {primaryCTA}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={secondaryCTALink}>{secondaryCTA}</Link>
            </Button>
          </div>
          <div className="mt-8">
            <CreditDisplay variant="compact" />
          </div>
        </div>
      </section>
    </div>
  );
}
