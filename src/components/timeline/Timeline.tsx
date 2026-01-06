"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Sparkles, Wrench } from "lucide-react";

export type TimelineItem = {
  id: string;
  timestampLabel: string;
  direction: "INBOUND" | "OUTBOUND";
  type: "MESSAGE" | "POST" | "COMMENT" | "LIKE" | "REACTION" | "CALL" | "SYSTEM" | "AI";
  title: string;
  body: string;
  signature?: string | null;
};

function iconFor(type: TimelineItem["type"]) {
  switch (type) {
    case "AI":
      return Sparkles;
    case "SYSTEM":
      return Wrench;
    default:
      return MessageSquare;
  }
}

export function Timeline(props: { items: TimelineItem[] }) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-0 bottom-0 w-px bg-zinc-200" />
      <div className="space-y-4">
        {props.items.map((item, idx) => {
          const Icon = iconFor(item.type);
          const side =
            item.direction === "OUTBOUND"
              ? "ml-auto border-zinc-200 bg-zinc-50"
              : "mr-auto border-zinc-200 bg-white";

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.15) }}
              className="relative pl-10"
            >
              <div className="absolute left-0 top-3 h-6 w-6 rounded-full border border-zinc-200 bg-white flex items-center justify-center">
                <Icon className="h-4 w-4 text-zinc-700" />
              </div>
              <div className={["max-w-[760px] rounded-xl border p-4 shadow-sm", side].join(" ")}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-zinc-900">{item.title}</div>
                  <div className="text-xs text-zinc-500">{item.timestampLabel}</div>
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">{item.body}</div>
                {item.signature ? (
                  <div className="mt-3 border-t border-zinc-200 pt-3 text-xs text-zinc-600">
                    {item.signature}
                  </div>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

