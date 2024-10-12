"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  AppWindow,
  ShoppingCart,
  Smartphone,
  Gamepad,
  Book,
  Music,
  FileText,
  Users,
  Map,
} from "lucide-react";
import NAV from "@/components/layout/nav";
import Footer from "@/components/layout/footer";

const templates = [
  {
    id: "social-media",
    name: "Social Media App",
    icon: <AppWindow className='w-6 h-6' />,
    prompt:
      "Create a PRD for a social media app focusing on short-form video content. Include features like video creation tools, user profiles, follower system, and engagement metrics. Address privacy concerns and content moderation strategies.",
  },
  {
    id: "e-commerce",
    name: "E-commerce Platform",
    icon: <ShoppingCart className='w-6 h-6' />,
    prompt:
      "Develop a PRD for an e-commerce platform specializing in handmade crafts. Include features such as seller profiles, product listings, secure payment processing, and a review system. Address logistics and quality control measures.",
  },
  {
    id: "fitness-tracker",
    name: "Fitness Tracking App",
    icon: <Smartphone className='w-6 h-6' />,
    prompt:
      "Design a PRD for a fitness tracking app that integrates with wearable devices. Include features like activity monitoring, goal setting, nutrition tracking, and social challenges. Address data privacy and accuracy of health metrics.",
  },
  {
    id: "mobile-game",
    name: "Mobile Game",
    icon: <Gamepad className='w-6 h-6' />,
    prompt:
      "Create a PRD for a mobile puzzle game with daily challenges. Include features like level progression, in-app purchases, leaderboards, and social sharing. Address monetization strategy and user retention mechanics.",
  },
  {
    id: "education-platform",
    name: "Online Learning Platform",
    icon: <Book className='w-6 h-6' />,
    prompt:
      "Develop a PRD for an online learning platform focused on language acquisition. Include features such as interactive lessons, progress tracking, virtual tutoring, and community forums. Address accessibility and localization requirements.",
  },
  {
    id: "music-streaming",
    name: "Music Streaming Service",
    icon: <Music className='w-6 h-6' />,
    prompt:
      "Design a PRD for a niche music streaming service specializing in independent artists. Include features like playlist curation, artist profiles, live streaming capabilities, and royalty tracking. Address copyright issues and artist payment models.",
  },
];

const addons = [
  {
    id: "trd",
    name: "Technical Requirements Document",
    icon: <FileText className='w-4 h-4 mr-2' />,
  },
  {
    id: "user-stories",
    name: "User Stories",
    icon: <Users className='w-4 h-4 mr-2' />,
  },
  {
    id: "roadmap",
    name: "Product Roadmap",
    icon: <Map className='w-4 h-4 mr-2' />,
  },
];

export default function Template() {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [customPrompt, setCustomPrompt] = useState(templates[0].prompt);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    setSelectedTemplate(template);
    setCustomPrompt(template.prompt);
  };

  const handlePromptChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setCustomPrompt(event.target.value);
  };

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  const handleGenerateDocument = () => {
    console.log("Generating document with prompt:", customPrompt);
    console.log("Selected addons:", selectedAddons);
    // Add your document generation logic here
  };

  const steps = [
    {
      title: "Select Template",
      description: "Choose a template that fits your project",
    },
    {
      title: "Customize Prompt",
      description: "Tailor the prompt to your specific needs",
    },
    {
      title: "Add-ons",
      description: "Select additional documents to generate",
    },
    { title: "Generate", description: "Review and generate your documents" },
  ];

  return (
    <>
      <NAV />
      <div className='container mx-auto px-4 py-16 max-w-6xl font-[family-name:var(--font-geist-sans)]'>
        <h1 className='text-4xl font-bold text-center mb-4'>
          Enhanced PRD Document Generator
        </h1>
        <p className='text-xl text-center text-muted-foreground mb-12'>
          Create comprehensive product documentation tailored to your needs
        </p>

        <Progress value={(currentStep + 1) * 25} className='mb-8' />

        <Tabs value={currentStep.toString()} className='w-full'>
          <TabsList className='grid w-full grid-cols-2 md:grid-cols-4 mb-8'>
            {steps.map((step, index) => (
              <TabsTrigger
                key={index}
                value={index.toString()}
                onClick={() => setCurrentStep(index)}
                disabled={index > currentStep}
                className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
              >
                {step.title}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value='0'>
            <Card>
              <CardHeader>
                <CardTitle className='text-2xl'>{steps[0].title}</CardTitle>
                <CardDescription>{steps[0].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedTemplate.id === template.id
                          ? "ring-2 ring-primary"
                          : ""
                      }`}
                      onClick={() => handleTemplateChange(template.id)}
                    >
                      <CardHeader className='flex flex-row items-center gap-4'>
                        <div className='bg-primary/10 p-2 rounded-full'>
                          {template.icon}
                        </div>
                        <CardTitle className='text-lg'>
                          {template.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className='text-sm text-muted-foreground line-clamp-3'>
                          {template.prompt}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => setCurrentStep(1)}
                  className='w-full sm:w-auto'
                >
                  Next: Customize Prompt
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value='1'>
            <Card>
              <CardHeader>
                <CardTitle className='text-2xl'>{steps[1].title}</CardTitle>
                <CardDescription>{steps[1].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className='h-[300px] w-full rounded-md border p-4'>
                  <Textarea
                    value={customPrompt}
                    onChange={handlePromptChange}
                    placeholder='Edit your prompt here...'
                    className='min-h-[280px] text-base'
                  />
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => setCurrentStep(2)}
                  className='w-full sm:w-auto'
                >
                  Next: Select Add-ons
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value='2'>
            <Card>
              <CardHeader>
                <CardTitle className='text-2xl'>{steps[2].title}</CardTitle>
                <CardDescription>{steps[2].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid gap-4'>
                  {addons.map((addon) => (
                    <div
                      key={addon.id}
                      className='flex items-center space-x-2 bg-secondary/50 p-4 rounded-lg'
                    >
                      <Checkbox
                        id={addon.id}
                        checked={selectedAddons.includes(addon.id)}
                        onCheckedChange={() => handleAddonToggle(addon.id)}
                      />
                      <Label
                        htmlFor={addon.id}
                        className='flex items-center cursor-pointer text-base'
                      >
                        {addon.icon}
                        {addon.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => setCurrentStep(3)}
                  className='w-full sm:w-auto'
                >
                  Next: Generate Documents
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value='3'>
            <Card>
              <CardHeader>
                <CardTitle className='text-2xl'>{steps[3].title}</CardTitle>
                <CardDescription>{steps[3].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  <div className='bg-secondary/30 p-4 rounded-lg'>
                    <h3 className='font-semibold text-lg mb-2'>
                      Selected Template:
                    </h3>
                    <p className='text-base'>{selectedTemplate.name}</p>
                  </div>
                  <div className='bg-secondary/30 p-4 rounded-lg'>
                    <h3 className='font-semibold text-lg mb-2'>
                      Customized Prompt:
                    </h3>
                    <p className='text-sm text-muted-foreground line-clamp-4'>
                      {customPrompt}
                    </p>
                  </div>
                  <div className='bg-secondary/30 p-4 rounded-lg'>
                    <h3 className='font-semibold text-lg mb-2'>
                      Selected Add-ons:
                    </h3>
                    {selectedAddons.length > 0 ? (
                      <ul className='list-disc list-inside'>
                        {selectedAddons.map((addonId) => (
                          <li key={addonId} className='text-base'>
                            {addons.find((a) => a.id === addonId)?.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className='text-base text-muted-foreground'>
                        No add-ons selected
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleGenerateDocument}
                  className='w-full sm:w-auto'
                >
                  Generate Documents
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </>
  );
}
