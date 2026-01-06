import * as React from "react";

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  const { className, ...rest } = props;
  return (
    <textarea
      className={[
        "min-h-[96px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm",
        "placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300",
        "disabled:opacity-50 disabled:pointer-events-none",
        className ?? "",
      ].join(" ")}
      {...rest}
    />
  );
}

