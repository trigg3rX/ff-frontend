"use client";

import React, { useRef } from "react";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { FormInput } from "@/components/ui/FormInput";
import { TemplateFieldSelector } from "@/blocks/configs/shared/TemplateFieldSelector";
import type { AiTransformNodeData } from "@/types/node-data";

interface AiTransformNodeConfigurationProps {
  nodeData: AiTransformNodeData & { id?: string };
  handleDataChange: (updates: Record<string, unknown>) => void;
}

export function AiTransformNodeConfiguration({
  nodeData,
  handleDataChange,
}: AiTransformNodeConfigurationProps) {
  const userPromptRef = useRef<HTMLTextAreaElement>(null);

  const insertIntoField = (
    field: "user",
    placeholder: string
  ) => {
    const ref = userPromptRef;
    const currentValue = nodeData.userPromptTemplate || "";
    const fieldKey = "userPromptTemplate";

    if (ref.current) {
      const textarea = ref.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newValue =
        currentValue.substring(0, start) +
        placeholder +
        currentValue.substring(end);
      handleDataChange({ [fieldKey]: newValue });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    } else {
      handleDataChange({ [fieldKey]: currentValue + placeholder });
    }
  };

  return (
    <>
      <SimpleCard className="p-5 space-y-5">
        {/* Header */}
        <header className="space-y-1">
          <Typography variant="bodySmall" className="font-semibold text-foreground">
            Prompts
          </Typography>
          <Typography variant="caption" className="text-muted-foreground block">
            Configure how the AI transforms your data
          </Typography>
        </header>

        {/* Insert fields from previous blocks – above */}
        <section className="space-y-1.5">
          <Typography variant="caption" className="text-muted-foreground font-medium">
            Insert fields from previous blocks
          </Typography>
          <TemplateFieldSelector
            currentNodeId={(nodeData.id as string) || ""}
            onInsertField={(placeholder) => {
              insertIntoField("user", placeholder);
            }}
          />
        </section>

        {/* User Prompt Template */}
        <section className="space-y-2">
          <FormInput
            ref={userPromptRef}
            id="user-prompt-template"
            label="User Prompt Template"
            required
            as="textarea"
            textareaProps={{
              value: nodeData.userPromptTemplate || "",
              onChange: (e) => handleDataChange({ userPromptTemplate: e.target.value }),
              placeholder: "Use the field selector above to insert dynamic values and think about the output you want...",
              rows: 5,
              className: "font-mono resize-y placeholder:text-xs",
            }}
          />
        </section>
      </SimpleCard>
    </>
  );
}