import { Platform, TimelineEventType } from "@/generated/prisma";

export type AdapterIdentity =
  | { type: "EMAIL"; value: string }
  | { type: "LINKEDIN"; value: string }
  | { type: "X"; value: string }
  | { type: "WHATSAPP"; value: string }
  | { type: "PHONE"; value: string };

export type InboundEventInput = {
  brandId: string;
  channelId: string;
  platform: Platform;
  sourceId?: string;

  type: Extract<TimelineEventType, "MESSAGE" | "POST" | "COMMENT">;
  timestamp: Date;

  // Required by principle; if adapter can't resolve it, ingestion will still
  // create a contact, but it will be non-deduplicable until identities are assigned.
  actorIdentity?: AdapterIdentity;

  // Adapter-native payload for compliance duplication.
  rawPayload: unknown;

  // Adapter-normalized content payload.
  content: unknown;
};

export type OutboundReplyInput = {
  brandId: string;
  channelId: string;
  conversationId: string;
  platform: Platform;
  sourceId?: string;

  type: "MESSAGE" | "COMMENT";
  timestamp: Date;

  // Stored as part of the event (mandatory).
  signature: string;

  rawPayload: unknown;
  content: unknown;
};

export interface PlatformAdapter {
  platform: Platform;

  // Ingest one inbound item (idempotent).
  ingestInbound(input: InboundEventInput): Promise<{ timelineEventId: string }>;

  // Send an outbound reply and store it as an event (idempotent).
  sendOutboundReply(input: OutboundReplyInput): Promise<{ timelineEventId: string }>;
}

