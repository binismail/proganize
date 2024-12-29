"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CreditDisplay } from "../shared/creditDisplay";
import { templates, Template } from "@/config/templates";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/app/context/appContext";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Icons } from "../ui/icons";

type TemplateType = Template["type"];

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template, values: any) => void;
}

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const { dispatch } = useAppContext();

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    const initialValues = template.structure.sections.reduce<
      Record<string, string>
    >(
      (acc, section) => ({
        ...acc,
        [section.name.toLowerCase()]: "",
      }),
      {}
    );
    setFormValues(initialValues);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate, formValues);
      setSelectedTemplate(null);
    }
  };

  const templateCategories: TemplateType[] = Array.from(
    new Set(templates.map((t) => t.type))
  );

  return (
    <div className='w-full'>
      {!selectedTemplate ? (
        <Tabs defaultValue={templateCategories[0]}>
          <TabsList className='mb-4'>
            {templateCategories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className='capitalize'
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          {templateCategories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className='grid grid-cols-3 gap-4 w-full'>
                {(templates as Template[])
                  .filter((template) => template.type === category)
                  .map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={cn(
                          "group relative flex flex-col items-start gap-2 rounded-xl border-2 border-primary/20",
                          "p-6 text-left hover:border-primary/40 hover:bg-primary/5",
                          "transition-all duration-200"
                        )}
                      >
                        <div className='flex items-center gap-4'>
                          <div className='rounded-lg bg-primary/10 p-2'>
                            <Icon className='h-6 w-6' />
                          </div>
                          <div>
                            <h3 className='font-semibold'>{template.name}</h3>
                            <p className='text-sm text-muted-foreground'>
                              {template.description}
                            </p>
                          </div>
                        </div>
                        <div className='mt-4 flex items-center text-sm text-muted-foreground'>
                          <Sparkles className='mr-2 h-4 w-4' />
                          AI Powered
                        </div>
                        <div className='absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100'>
                          <Sparkles className='h-5 w-5 text-primary' />
                        </div>
                      </button>
                    );
                  })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card className='p-6'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Button variant='ghost' onClick={() => setSelectedTemplate(null)}>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to templates
              </Button>
              <div className='flex items-center gap-2'>
                <selectedTemplate.icon className='h-6 w-6' />
                <h3 className='text-lg font-semibold'>
                  {selectedTemplate.name}
                </h3>
              </div>
            </div>

            <div className='grid gap-4'>
              {selectedTemplate.structure.sections.map((section) => (
                <div key={section.name} className='space-y-2'>
                  <Label>
                    {section.name}
                    {section.required && (
                      <span className='text-destructive'>*</span>
                    )}
                  </Label>
                  <Input
                    placeholder={section.description}
                    value={formValues[section.name.toLowerCase()] || ""}
                    onChange={(e) =>
                      handleInputChange(
                        section.name.toLowerCase(),
                        e.target.value
                      )
                    }
                    required={section.required}
                  />
                </div>
              ))}
            </div>

            <div className='flex justify-between items-center mt-4'>
              <CreditDisplay variant='minimal' />
              <Button onClick={handleSubmit}>
                Create {selectedTemplate.name}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
