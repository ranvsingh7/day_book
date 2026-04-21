"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon";
type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-7 px-2 text-xs",
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-11 w-11 justify-center p-0",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-500",
  secondary: "bg-slate-900 text-white hover:bg-slate-700",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  danger: "border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
};

export function Button({
  children,
  size = "md",
  variant = "primary",
  fullWidth = false,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        "focus-ring inline-flex cursor-pointer items-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
