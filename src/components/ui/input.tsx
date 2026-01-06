import * as React from "react";

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  const { className, ...rest } = props;
  return (
    <input
      className={[
        "h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm",
        "placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300",
        "disabled:opacity-50 disabled:pointer-events-none",
        className ?? "",
      ].join(" ")}
      {...rest}
    />
  );
}

