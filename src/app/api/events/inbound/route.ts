import { z } from "zod";
import { ingestInboundEvent } from "@/lib/ingest/ingestInboundEvent";
import { Platform, TimelineEventType } from "@/generated/prisma";

const schema = z.object({
  brandId: z.string().min(1),
  channelId: z.string().min(1),
  platform: z.nativeEnum(Platform),
  conversationId: z.string().optional(),
  sourceId: z.string().optional(),
  type: z.enum(["MESSAGE", "POST", "COMMENT"]) satisfies z.ZodType<
    Extract<TimelineEventType, "MESSAGE" | "POST" | "COMMENT">
  >,
  timestamp: z.coerce.date(),
  actorIdentity: z
    .discriminatedUnion("type", [
      z.object({ type: z.literal("EMAIL"), value: z.string().min(1) }),
      z.object({ type: z.literal("LINKEDIN"), value: z.string().min(1) }),
      z.object({ type: z.literal("X"), value: z.string().min(1) }),
      z.object({ type: z.literal("WHATSAPP"), value: z.string().min(1) }),
      z.object({ type: z.literal("PHONE"), value: z.string().min(1) }),
    ])
    .optional(),
  content: z.unknown(),
  rawPayload: z.unknown(),
});

export async function POST(req: Request) {
  const body = schema.parse(await req.json());
  const result = await ingestInboundEvent(body);
  return Response.json(result);
}

