import { 
  FileText, 
  Share2, 
  GraduationCap, 
  ClipboardList, 
  BookOpen,
  FileSearch,
  PenTool,
  Presentation,
  BookMarked,
  FileSpreadsheet,
  FileCheck,
  Mail,
  FileQuestion,
  FileCode,
  ScrollText,
  BookOpen as BookIcon,
  Newspaper,
  MessageSquare,
  FileText as DocumentIcon,
  GraduationCap as AcademicIcon
} from 'lucide-react';

export interface Template {
  id: string;
  name: string;
  type: 'academic' | 'professional' | 'student' | 'research' | 'blog' | 'social';
  description: string;
  icon: any;
  prompt: string;
  structure: {
    sections: Array<{
      name: string;
      description: string;
      required: boolean;
    }>;
  };
  defaultContent?: string;
}

export const templates: Template[] = [
  // Academic Templates
  {
    id: 'research-paper',
    name: 'Research Paper',
    type: 'academic',
    description: 'Write academic research papers following standard format',
    icon: FileSearch,
    prompt: `Create a research paper following academic standards:
    1. Clear research question/hypothesis
    2. Comprehensive literature review
    3. Detailed methodology
    4. Results analysis
    5. Discussion and conclusions`,
    structure: {
      sections: [
        {
          name: 'Title',
          description: 'Clear, specific title describing the research',
          required: true,
        },
        {
          name: 'Abstract',
          description: 'Brief summary of the entire paper',
          required: true,
        },
        {
          name: 'Introduction',
          description: 'Background, research question, and significance',
          required: true,
        },
        {
          name: 'Methodology',
          description: 'Research methods and procedures',
          required: true,
        },
        {
          name: 'Results',
          description: 'Findings and data analysis',
          required: true,
        },
        {
          name: 'Discussion',
          description: 'Interpretation of results and implications',
          required: true,
        },
      ],
    },
  },
  {
    id: 'thesis-proposal',
    name: 'Thesis Proposal',
    type: 'academic',
    description: 'Structure your thesis proposal effectively',
    icon: BookMarked,
    prompt: `Create a thesis proposal that:
    1. Clearly states research objectives
    2. Reviews relevant literature
    3. Outlines methodology
    4. Discusses expected outcomes
    5. Includes timeline and resources needed`,
    structure: {
      sections: [
        {
          name: 'Title',
          description: 'Specific, descriptive title',
          required: true,
        },
        {
          name: 'Research Objectives',
          description: 'Clear statement of research goals',
          required: true,
        },
        {
          name: 'Literature Review',
          description: 'Summary of relevant research',
          required: true,
        },
        {
          name: 'Methodology',
          description: 'Proposed research methods',
          required: true,
        },
        {
          name: 'Timeline',
          description: 'Project schedule and milestones',
          required: true,
        },
      ],
    },
  },
  {
    id: 'literature-review',
    name: 'Literature Review',
    type: 'academic',
    description: 'Synthesize and analyze academic literature',
    icon: BookOpen,
    prompt: `Create a comprehensive literature review that:
    1. Synthesizes existing research
    2. Identifies key themes and gaps
    3. Evaluates methodologies
    4. Suggests future research directions`,
    structure: {
      sections: [
        {
          name: 'Topic',
          description: 'Focus area of the review',
          required: true,
        },
        {
          name: 'Search Strategy',
          description: 'Databases and keywords used',
          required: true,
        },
        {
          name: 'Analysis',
          description: 'Synthesis of findings',
          required: true,
        },
        {
          name: 'Gaps',
          description: 'Research gaps identified',
          required: true,
        },
      ],
    },
  },

  // Student Templates
  {
    id: 'study-notes',
    name: 'Study Notes',
    type: 'student',
    description: 'Create organized study notes for better retention',
    icon: PenTool,
    prompt: `Create comprehensive study notes that:
    1. Summarize key concepts
    2. Include examples and explanations
    3. Use bullet points and headings
    4. Add mnemonics or memory aids`,
    structure: {
      sections: [
        {
          name: 'Topic',
          description: 'Main subject or concept',
          required: true,
        },
        {
          name: 'Key Points',
          description: 'Important concepts to remember',
          required: true,
        },
        {
          name: 'Examples',
          description: 'Practical examples or cases',
          required: true,
        },
        {
          name: 'Summary',
          description: 'Brief recap of main points',
          required: true,
        },
      ],
    },
  },
  {
    id: 'essay-outline',
    name: 'Essay Outline',
    type: 'student',
    description: 'Structure your essays effectively',
    icon: ClipboardList,
    prompt: `Create a detailed essay outline that:
    1. Has a clear thesis statement
    2. Includes main arguments
    3. Provides supporting evidence
    4. Follows logical progression`,
    structure: {
      sections: [
        {
          name: 'Thesis',
          description: 'Main argument or point',
          required: true,
        },
        {
          name: 'Main Points',
          description: 'Key arguments to support thesis',
          required: true,
        },
        {
          name: 'Evidence',
          description: 'Supporting facts and examples',
          required: true,
        },
        {
          name: 'Conclusion',
          description: 'Summary and implications',
          required: true,
        },
      ],
    },
  },
  {
    id: 'presentation',
    name: 'Presentation Script',
    type: 'student',
    description: 'Create engaging presentation scripts',
    icon: Presentation,
    prompt: `Create a presentation script that:
    1. Engages the audience
    2. Clearly explains concepts
    3. Includes transition statements
    4. Ends with key takeaways`,
    structure: {
      sections: [
        {
          name: 'Introduction',
          description: 'Opening hook and overview',
          required: true,
        },
        {
          name: 'Main Content',
          description: 'Key points with transitions',
          required: true,
        },
        {
          name: 'Visual Cues',
          description: 'Notes for slides/visuals',
          required: true,
        },
        {
          name: 'Conclusion',
          description: 'Summary and call to action',
          required: true,
        },
      ],
    },
  },

  // Professional Templates
  {
    id: 'business-proposal',
    name: 'Business Proposal',
    type: 'professional',
    description: 'Create compelling business proposals',
    icon: FileSpreadsheet,
    prompt: `Create a business proposal that:
    1. Addresses client needs
    2. Outlines clear solutions
    3. Includes pricing and timeline
    4. Highlights company strengths`,
    structure: {
      sections: [
        {
          name: 'Executive Summary',
          description: 'Brief overview of proposal',
          required: true,
        },
        {
          name: 'Problem Statement',
          description: 'Client needs and challenges',
          required: true,
        },
        {
          name: 'Solution',
          description: 'Proposed solution details',
          required: true,
        },
        {
          name: 'Pricing',
          description: 'Cost breakdown and terms',
          required: true,
        },
      ],
    },
  },
  {
    id: 'technical-doc',
    name: 'Technical Documentation',
    type: 'professional',
    description: 'Write clear technical documentation',
    icon: FileCode,
    prompt: `Create technical documentation that:
    1. Is clear and concise
    2. Includes step-by-step instructions
    3. Provides examples
    4. Addresses common issues`,
    structure: {
      sections: [
        {
          name: 'Overview',
          description: 'Purpose and scope',
          required: true,
        },
        {
          name: 'Prerequisites',
          description: 'Required setup/knowledge',
          required: true,
        },
        {
          name: 'Instructions',
          description: 'Step-by-step guide',
          required: true,
        },
        {
          name: 'Troubleshooting',
          description: 'Common issues and solutions',
          required: true,
        },
      ],
    },
  },
  {
    id: 'project-report',
    name: 'Project Report',
    type: 'professional',
    description: 'Document project progress and outcomes',
    icon: FileCheck,
    prompt: `Create a project report that:
    1. Summarizes objectives and scope
    2. Details progress and milestones
    3. Discusses challenges and solutions
    4. Provides recommendations`,
    structure: {
      sections: [
        {
          name: 'Executive Summary',
          description: 'Brief project overview',
          required: true,
        },
        {
          name: 'Progress',
          description: 'Milestone achievements',
          required: true,
        },
        {
          name: 'Challenges',
          description: 'Issues and resolutions',
          required: true,
        },
        {
          name: 'Next Steps',
          description: 'Recommendations and plans',
          required: true,
        },
      ],
    },
  },

  // Research Templates
  {
    id: 'research-grant',
    name: 'Grant Proposal',
    type: 'research',
    description: 'Write compelling research grant proposals',
    icon: ScrollText,
    prompt: `Create a grant proposal that:
    1. Clearly states research significance
    2. Details methodology
    3. Includes budget and timeline
    4. Addresses impact and outcomes`,
    structure: {
      sections: [
        {
          name: 'Project Summary',
          description: 'Brief overview of research',
          required: true,
        },
        {
          name: 'Research Plan',
          description: 'Detailed methodology',
          required: true,
        },
        {
          name: 'Budget',
          description: 'Cost breakdown',
          required: true,
        },
        {
          name: 'Impact',
          description: 'Expected outcomes and benefits',
          required: true,
        },
      ],
    },
  },
  {
    id: 'research-abstract',
    name: 'Research Abstract',
    type: 'research',
    description: 'Write concise research abstracts',
    icon: FileQuestion,
    prompt: `Create a research abstract that:
    1. Summarizes research purpose
    2. Outlines methodology
    3. Presents key findings
    4. States implications`,
    structure: {
      sections: [
        {
          name: 'Background',
          description: 'Research context',
          required: true,
        },
        {
          name: 'Methods',
          description: 'Brief methodology',
          required: true,
        },
        {
          name: 'Results',
          description: 'Key findings',
          required: true,
        },
        {
          name: 'Conclusion',
          description: 'Implications and impact',
          required: true,
        },
      ],
    },
  },

  // Blog Templates
  {
    id: 'blog-post',
    name: 'Blog Post',
    type: 'blog',
    description: 'Create SEO-optimized blog posts',
    icon: FileText,
    prompt: `Create a blog post that:
    1. Has an engaging headline
    2. Uses SEO best practices
    3. Includes relevant examples
    4. Ends with a call to action`,
    structure: {
      sections: [
        {
          name: 'Title',
          description: 'SEO-friendly headline',
          required: true,
        },
        {
          name: 'Introduction',
          description: 'Hook and overview',
          required: true,
        },
        {
          name: 'Main Content',
          description: 'Key points with examples',
          required: true,
        },
        {
          name: 'Conclusion',
          description: 'Summary and next steps',
          required: true,
        },
      ],
    },
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    type: 'blog',
    description: 'Write engaging email newsletters',
    icon: Mail,
    prompt: `Create a newsletter that:
    1. Has an attention-grabbing subject
    2. Provides valuable content
    3. Maintains reader interest
    4. Includes clear CTAs`,
    structure: {
      sections: [
        {
          name: 'Subject Line',
          description: 'Compelling email subject',
          required: true,
        },
        {
          name: 'Opening',
          description: 'Engaging introduction',
          required: true,
        },
        {
          name: 'Main Story',
          description: 'Primary content focus',
          required: true,
        },
        {
          name: 'Call to Action',
          description: 'Next steps for readers',
          required: true,
        },
      ],
    },
  },

  // Social Media Templates
  {
    id: 'viral-tweet',
    name: 'Viral Tweet',
    type: 'social',
    description: 'Craft engaging tweets optimized for virality',
    icon: MessageSquare,
    prompt: `Create a tweet that's designed to go viral by:
    1. Using powerful hooks or shocking statements
    2. Leveraging current trends and conversations
    3. Including relatable experiences or insights
    4. Using effective formatting (line breaks, emojis)
    5. Making it easy to retweet/quote tweet`,
    structure: {
      sections: [
        {
          name: 'Hook',
          description: 'Attention-grabbing first line (under 40 chars)',
          required: true,
        },
        {
          name: 'Main Point',
          description: 'Core message or insight',
          required: true,
        },
        {
          name: 'Engagement Hook',
          description: 'Question or call-to-action for engagement',
          required: true,
        },
        {
          name: 'Hashtags',
          description: 'Trending or relevant hashtags (max 2)',
          required: false,
        }
      ],
    },
  },
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    type: 'social',
    description: 'Create engaging LinkedIn content',
    icon: Share2,
    prompt: `Create a LinkedIn post that:
    1. Starts with a hook
    2. Shares valuable insights
    3. Uses appropriate formatting
    4. Includes relevant hashtags`,
    structure: {
      sections: [
        {
          name: 'Hook',
          description: 'Attention-grabbing opener',
          required: true,
        },
        {
          name: 'Story',
          description: 'Main message or insight',
          required: true,
        },
        {
          name: 'Takeaway',
          description: 'Key lesson or action item',
          required: true,
        },
        {
          name: 'Hashtags',
          description: 'Relevant hashtags',
          required: false,
        },
      ],
    },
  },
  {
    id: 'social-campaign',
    name: 'Social Media Campaign',
    type: 'social',
    description: 'Plan multi-platform social campaigns',
    icon: MessageSquare,
    prompt: `Create a social media campaign that:
    1. Has consistent messaging
    2. Adapts to each platform
    3. Includes visual guidelines
    4. Sets clear objectives`,
    structure: {
      sections: [
        {
          name: 'Objective',
          description: 'Campaign goals',
          required: true,
        },
        {
          name: 'Content Plan',
          description: 'Platform-specific posts',
          required: true,
        },
        {
          name: 'Schedule',
          description: 'Posting timeline',
          required: true,
        },
        {
          name: 'Metrics',
          description: 'Success indicators',
          required: true,
        },
      ],
    },
  },
];
