import { z } from "zod";
import { acquireReplyLock, releaseReplyLock } from "@/lib/replyLock";

const acquireSchema = z.object({
  brandId: z.string().min(1),
  conversationId: z.string().min(1),
  userId: z.string().min(1),
  lastEventId: z.string(), // empty string allowed when conversation has no events yet
});

export async function POST(req: Request) {
  const body = acquireSchema.parse(await req.json());
  const result = await acquireReplyLock({
    brandId: body.brandId,
    conversationId: body.conversationId,
    userId: body.userId,
    lastEventId: body.lastEventId,
  });
  return Response.json(result);
}

const releaseSchema = z.object({
  conversationId: z.string().min(1),
  userId: z.string().min(1),
});

export async function DELETE(req: Request) {
  const body = releaseSchema.parse(await req.json());
  const result = await releaseReplyLock(body);
  return Response.json(result);
}

