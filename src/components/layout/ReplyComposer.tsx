"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type LockState =
  | { status: "idle" }
  | { status: "locked"; lockedByUserId: string; expiresAt?: string }
  | { status: "conflict"; currentLastEventId?: string }
  | { status: "acquired" };

export function ReplyComposer(props: {
  brandId: string;
  conversationId: string;
  lastEventId: string;
}) {
  type PlatformString =
    | "X"
    | "INSTAGRAM"
    | "FACEBOOK"
    | "LINKEDIN"
    | "WHATSAPP"
    | "EMAIL"
    | "REDDIT"
    | "SNAPCHAT";

  const [userId, setUserId] = React.useState("");
  const [channelId, setChannelId] = React.useState("");
  const [platform, setPlatform] = React.useState<PlatformString>("EMAIL");
  const [signature, setSignature] = React.useState("");
  const [body, setBody] = React.useState("");
  const [lock, setLock] = React.useState<LockState>({ status: "idle" });
  const [busy, setBusy] = React.useState(false);

  async function acquire() {
    setBusy(true);
    try {
      const res = await fetch("/api/reply-lock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          brandId: props.brandId,
          conversationId: props.conversationId,
          userId,
          lastEventId: props.lastEventId,
        }),
      });
      const json = (await res.json()) as
        | { ok: true }
        | { ok: false; reason: "locked" | "conflict"; lockedByUserId?: string; expiresAt?: string; currentLastEventId?: string };
      if (json.ok) setLock({ status: "acquired" });
      else if (json.reason === "locked")
        setLock({ status: "locked", lockedByUserId: json.lockedByUserId ?? "unknown", expiresAt: json.expiresAt });
      else setLock({ status: "conflict", currentLastEventId: json.currentLastEventId });
    } finally {
      setBusy(false);
    }
  }

  async function release() {
    setBusy(true);
    try {
      await fetch("/api/reply-lock", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversationId: props.conversationId,
          userId,
        }),
      });
      setLock({ status: "idle" });
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    setBusy(true);
    try {
      await fetch("/api/events/outbound", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          brandId: props.brandId,
          channelId,
          platform,
          conversationId: props.conversationId,
          type: "MESSAGE",
          timestamp: new Date().toISOString(),
          signature,
          content: { text: body },
          rawPayload: { text: body },
        }),
      });
      // The UI is optimistic-minimal: refresh to show new append-only event.
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  const canAcquire = userId.length > 0 && !busy && lock.status !== "acquired";
  const canSend =
    lock.status === "acquired" &&
    !busy &&
    channelId.length > 0 &&
    signature.length > 0 &&
    body.trim().length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="text-sm font-medium">Reply (single unified UI)</div>
        <div className="text-xs text-zinc-600">
          First-come-first-serve lock on conversation + last event.
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <div className="text-xs text-zinc-600">User ID</div>
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user_..." />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-zinc-600">Channel ID</div>
            <Input value={channelId} onChange={(e) => setChannelId(e.target.value)} placeholder="channel_..." />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-zinc-600">Platform</div>
            <Input
              value={platform}
              onChange={(e) => setPlatform(e.target.value as PlatformString)}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-zinc-600">Signature (mandatory)</div>
            <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="— Name, Title" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-zinc-600">Message</div>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a reply..." />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={acquire} disabled={!canAcquire} variant="secondary">
            Acquire reply lock
          </Button>
          <Button onClick={release} disabled={busy || lock.status !== "acquired"} variant="ghost">
            Release lock
          </Button>
          <Button onClick={send} disabled={!canSend}>
            Send (append event)
          </Button>
          <div className="text-xs text-zinc-600">
            Lock:{" "}
            {lock.status === "idle"
              ? "idle"
              : lock.status === "acquired"
                ? "acquired"
                : lock.status === "locked"
                  ? `locked by ${lock.lockedByUserId}`
                  : `conflict (refresh)`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

