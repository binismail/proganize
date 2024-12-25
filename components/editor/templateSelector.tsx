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

type TemplateType = Template["type"];

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template, values: any) => void;
}

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [formValues, setFormValues] = useState<Record<string, string>>({});

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
    <div className='space-y-4'>
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
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {(templates as Template[])
                  .filter((template) => template.type === category)
                  .map((template) => (
                    <Card
                      key={template.id}
                      className={cn(
                        "cursor-pointer hover:border-primary transition-colors"
                      )}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardHeader>
                        <div className='flex items-center gap-2'>
                          <template.icon className='h-6 w-6' />
                          <CardTitle className='text-lg'>
                            {template.name}
                          </CardTitle>
                        </div>
                        <CardDescription>
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card className='p-6'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <selectedTemplate.icon className='h-6 w-6' />
                <h3 className='text-lg font-semibold'>
                  {selectedTemplate.name}
                </h3>
              </div>
              <Button variant='ghost' onClick={() => setSelectedTemplate(null)}>
                Back to templates
              </Button>
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
              <Button onClick={handleSubmit}>Create Document</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
