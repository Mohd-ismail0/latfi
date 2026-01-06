import { prisma } from "@/lib/db";
import { encryptJsonForEvent } from "@/lib/crypto/envelope";
import {
  Platform,
  TimelineDirection,
  TimelineEventType,
} from "@/generated/prisma";

export type IngestOutboundReplyArgs = {
  brandId: string;
  channelId: string;
  platform: Platform;
  conversationId: string;
  sourceId?: string;

  type: Extract<TimelineEventType, "MESSAGE" | "COMMENT">;
  timestamp: Date;

  signature: string;
  content: unknown;
  rawPayload: unknown;
};

export async function ingestOutboundReply(args: IngestOutboundReplyArgs): Promise<{
  timelineEventId: string;
}> {
  // Validate conversation belongs to the brand boundary.
  const conversation = await prisma.conversation.findUnique({
    where: { id: args.conversationId },
    select: { id: true, brandId: true },
  });
  if (!conversation) throw new Error("Conversation not found");
  if (conversation.brandId !== args.brandId) throw new Error("Cross-brand access denied");

  const event = await prisma.timelineEvent.create({
    data: {
      brandId: args.brandId,
      conversationId: args.conversationId,
      channelId: args.channelId,
      platform: args.platform,
      type: args.type as TimelineEventType,
      direction: TimelineDirection.OUTBOUND,
      signature: args.signature,
      contentEncrypted: encryptJsonForEvent(args.content),
      rawPayloadEncrypted: encryptJsonForEvent(args.rawPayload),
      sourceId: args.sourceId,
      timestamp: args.timestamp,
    },
    select: { id: true },
  });

  return { timelineEventId: event.id };
}

