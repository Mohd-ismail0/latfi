import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brand Comms OS",
  description: "Internal brand communications operating system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
