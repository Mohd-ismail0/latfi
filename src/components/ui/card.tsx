import * as React from "react";

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return (
    <div
      className={[
        "rounded-xl border border-zinc-200 bg-white shadow-sm",
        className ?? "",
      ].join(" ")}
      {...rest}
    />
  );
}

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return (
    <div className={["p-4 border-b border-zinc-100", className ?? ""].join(" ")} {...rest} />
  );
}

export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return <div className={["p-4", className ?? ""].join(" ")} {...rest} />;
}

