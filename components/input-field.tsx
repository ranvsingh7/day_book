"use client";

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type InputFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "children"
> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string;
  className?: string;
};

export function InputField({
  label,
  value,
  onChange,
  containerClassName = "",
  type = "text",
  className = "",
  ...inputProps
}: InputFieldProps) {
  const numberInputClassNames =
    type === "number"
      ? "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      : "";

  const handleKeyDown: InputHTMLAttributes<HTMLInputElement>["onKeyDown"] = (event) => {
    if (type === "number" && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
    }

    inputProps.onKeyDown?.(event);
  };

  return (
    <label className={`grid gap-1 text-sm text-slate-600 ${containerClassName}`}>
      <span className="font-medium">{label}</span>
      <input
        value={value}
        type={type}
        {...inputProps}
        onKeyDown={handleKeyDown}
        onChange={(event) => onChange(event.target.value)}
        className={`focus-ring min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-indigo-300 disabled:cursor-not-allowed disabled:opacity-70 ${numberInputClassNames} ${className}`}
      />
    </label>
  );
}

type TextAreaFieldProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange" | "children"
> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string;
  className?: string;
};

export function TextAreaField({
  label,
  value,
  onChange,
  containerClassName = "",
  rows = 3,
  className = "",
  ...textareaProps
}: TextAreaFieldProps) {
  return (
    <label className={`grid gap-1 text-sm text-slate-600 ${containerClassName}`}>
      <span className="font-medium">{label}</span>
      <textarea
        value={value}
        rows={rows}
        {...textareaProps}
        onChange={(event) => onChange(event.target.value)}
        className={`focus-ring rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-indigo-300 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      />
    </label>
  );
}
