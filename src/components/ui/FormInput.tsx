"use client";

import * as React from "react";
import { twMerge } from "tailwind-merge";
import { cn } from "@/lib/utils";
import { InputProps } from "./Input";
import { Typography } from "./Typography";

export interface FormInputProps extends Omit<InputProps, "id"> {
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  id?: string;
  as?: "input" | "textarea";
  textareaProps?: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;
  onValueChange?: (value: string) => void;
}

const FormInput = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  FormInputProps
>(
  (
    {
      label,
      required = false,
      helperText,
      error,
      id,
      className,
      as = "input",
      textareaProps,
      onChange,
      onValueChange,
      type,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || `form-input-${generatedId}`;
    const hasError = !!error;

    // Extract onChange and className from textareaProps to handle them separately
    const { onChange: textareaOnChange, className: textareaClassName, ...restTextareaProps } = textareaProps || {};

    return (
      <div className="space-y-2">
        <label htmlFor={inputId} className="block">
          {label && (
            <Typography
              variant="caption"
              className={cn(
                "mb-1",
                hasError ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Typography>
          )}
          {as === "input" ? (
            <>
              <input
                type={type}
                className={twMerge(
                  "w-full text-xs bg-white/5 text-white py-3 px-4 rounded-lg border border-white/10 placeholder-gray-400 outline-none focus:border-white/50",
                  "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]",
                  error ? "border-red-500" : "",
                  className,
                )}
                onChange={(e) => {
                  onChange?.(e);
                  if (onValueChange) onValueChange(e.target.value);
                }}
                id={inputId}
                ref={ref as React.ForwardedRef<HTMLInputElement>}
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? `${inputId}-error` : undefined}
                {...props}
              />
              {error && (
                <div className="text-red-500 text-xs sm:text-sm mt-2">{error}</div>
              )}
            </>
          ) : (
            <>
              <textarea
                className={twMerge(
                  "w-full text-sm xs:text-sm sm:text-base bg-white/5 text-white py-3 px-4 rounded-lg border border-white/10 placeholder-gray-400 outline-none focus:border-white/50 min-h-[120px]",
                  error ? "border-red-500" : "",
                  textareaClassName,
                  className,
                )}
                onChange={(e) => {
                  textareaOnChange?.(e);
                  if (onValueChange) onValueChange(e.target.value);
                }}
                id={inputId}
                ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? `${inputId}-error` : undefined}
                {...restTextareaProps}
              />
              {error && (
                <div className="text-red-500 text-xs sm:text-sm mt-2">{error}</div>
              )}
            </>
          )}
        </label>
        {helperText && !error && (
          <Typography variant="caption" className="text-muted-foreground">
            {helperText}
          </Typography>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export { FormInput };
