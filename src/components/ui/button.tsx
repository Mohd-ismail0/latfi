import * as React from "react";

type ButtonVariant = "default" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  default: "bg-zinc-900 text-white hover:bg-zinc-800",
  secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
  ghost: "bg-transparent hover:bg-zinc-100 text-zinc-900",
  destructive: "bg-red-600 text-white hover:bg-red-500",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3",
  md: "h-10 px-4",
};

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  },
) {
  const { className, variant = "default", size = "md", ...rest } = props;
  return (
    <button
      className={[
        base,
        variants[variant],
        sizes[size],
        className ?? "",
      ].join(" ")}
      {...rest}
    />
  );
}

