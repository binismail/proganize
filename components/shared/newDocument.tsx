import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileText, Users, Lightbulb, Eye, Map, BookOpen } from "lucide-react";
import DocumentGenerator from "./documentGenerator";

const documentTypes = [
  {
    id: "blankDoc",
    title: "Start a blank document",
    icon: BookOpen,
    description:
      "Get your Idea off the ground by getting your document off the ground",
  },
  {
    id: "technical-spec",
    title: "Technical Requirements",
    icon: FileText,
    description:
      "List the specific technologies, platforms, and technical needs that drive your product’s development.",
  },
  {
    id: "product-insights",
    title: "Product Requirement Document (PRD)",
    icon: Lightbulb,
    description:
      "Plan your product's journey from concept to execution with a comprehensive guide.",
  },
  {
    id: "user-stories",
    title: "User Stories",
    icon: Users,
    description:
      "Define who your users are, what they need, and why, in clear, concise stories.",
  },
  {
    id: "readmes",
    title: "READMEs",
    icon: Eye,
    description:
      "Provide developers with a clear, well-organized README to guide contributions and usage.",
  },
  {
    id: "roadmap",
    title: "Roadmap",
    icon: Map,
    description:
      "Lay out the steps and goals from MVP to market, ensuring transparency and direction.",
  },
];

const templates = {
  "user-stories": [
    "Basic User Story",
    "Detailed User Journey",
    "Feature Request",
  ],
  "technical-spec": [
    "API Documentation",
    "System Architecture",
    "Database Schema",
  ],
  "product-insights": [
    "Market Analysis",
    "Feature Impact",
    "User Feedback Summary",
  ],
  readmes: [
    "Basic README Template",
    "Detailed Project Overview",
    "Installation & Usage Guide",
    "Contribution Guidelines",
    "License & Acknowledgements",
  ],
  roadmap: [
    "Quarterly Product Roadmap",
    "Annual Milestone Plan",
    "Feature Rollout Schedule",
    "Long-Term Vision Outline",
  ],
};

export default function NewDocument({
  openDocument,
  onClose,
}: {
  openDocument: boolean;
  onClose: () => void;
}) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const getPlaceholderText = () => {
    if (!selectedType) return "";

    const placeholders: Record<string, Record<string, string>> = {
      "user-stories": {
        "Basic User Story":
          "Let's outline a simple user story. Who is the user, and what do they need?",
        "Detailed User Journey":
          "Walk me through the user's journey. What steps will they take?",
        "Feature Request":
          "Describe the feature you have in mind. How will it help users?",
      },
      "technical-spec": {
        "API Documentation":
          "Tell me about the API details. What endpoints will we need?",
        "System Architecture":
          "Describe the system architecture. What components are essential?",
        "Database Schema":
          "Outline the database structure. What data needs to be stored?",
      },
      "product-insights": {
        "Market Analysis":
          "Let's dive into the market. Who are the competitors, and what’s our advantage?",
        "Feature Impact":
          "Describe how this feature will impact the product. Why is it valuable?",
        "User Feedback Summary":
          "Summarize the user feedback. What are the main takeaways?",
      },
      readmes: {
        "Basic README Template":
          "Let’s start with a basic README. What’s the purpose of this project?",
        "Detailed Project Overview":
          "Give a project overview. What makes it unique?",
        "Installation & Usage Guide":
          "Guide users on installation and usage. Any special steps?",
        "Contribution Guidelines":
          "Let’s outline contribution guidelines. How can others contribute?",
        "License & Acknowledgements":
          "Enter license details and credits. Who should be acknowledged?",
      },
      roadmap: {
        "Quarterly Product Roadmap": "What are our goals for this quarter?",
        "Annual Milestone Plan":
          "Describe the annual milestones we aim to hit.",
        "Feature Rollout Schedule":
          "Let’s organize the feature rollout schedule. What's first?",
        "Long-Term Vision Outline":
          "Describe the long-term vision. Where do we want to go?",
      },
      blankDoc: {
        default:
          "Start a new document from scratch. What are you aiming to create? Feel free to share, and I can guide you if it fits within our documentation tools.",
      },
    };

    return selectedType === "blankDoc"
      ? placeholders["blankDoc"].default // Return the placeholder for blankDoc
      : placeholders[selectedType as keyof typeof placeholders]?.[
          selectedTemplate || ""
        ] || "";
  };

  return (
    <Dialog open={openDocument} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>New Document</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-6'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='document-type'>
                What document would you like to start with
              </Label>
              <Select onValueChange={(value) => setSelectedType(value)}>
                <SelectTrigger id='document-type'>
                  <SelectValue placeholder='Select document type' />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className='flex items-center'>
                        <type.icon className='h-4 w-4 mr-2' />
                        {type.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedType &&
              selectedType !== "blankDoc" && ( // Check if selectedType is not "blankDoc"
                <div className='space-y-2'>
                  <Label>Select templates (Optional)</Label>
                  <RadioGroup onValueChange={setSelectedTemplate}>
                    {templates[selectedType as keyof typeof templates].map(
                      (template) => (
                        <div
                          key={template}
                          className='flex items-center space-x-2 cursor-pointer gap-2'
                        >
                          <RadioGroupItem value={template} id={template} />
                          <Label htmlFor={template}>{template}</Label>
                        </div>
                      )
                    )}
                  </RadioGroup>
                </div>
              )}
          </div>
          <div>
            <DocumentGenerator
              subscriptionStatus='inactive'
              placeholderText={getPlaceholderText() || ""} // Pass an empty string if getPlaceholderText() returns null
              documentType={selectedType || ""} // Pass an empty string if selectedType is null
              template={selectedTemplate || ""} // Pass an empty string if selectedTemplate is null
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
