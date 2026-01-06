import { z } from "zod";
import { ingestOutboundReply } from "@/lib/ingest/ingestOutboundReply";
import { Platform, TimelineEventType } from "@/generated/prisma";

const schema = z.object({
  brandId: z.string().min(1),
  channelId: z.string().min(1),
  platform: z.nativeEnum(Platform),
  conversationId: z.string().min(1),
  sourceId: z.string().optional(),
  type: z.enum(["MESSAGE", "COMMENT"]) satisfies z.ZodType<
    Extract<TimelineEventType, "MESSAGE" | "COMMENT">
  >,
  timestamp: z.coerce.date(),
  signature: z.string().min(1),
  content: z.unknown(),
  rawPayload: z.unknown(),
});

export async function POST(req: Request) {
  const body = schema.parse(await req.json());
  const result = await ingestOutboundReply(body);
  return Response.json(result);
}

