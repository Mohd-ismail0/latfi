import { prisma } from "@/lib/db";

export type AcquireReplyLockArgs = {
  brandId: string;
  conversationId: string;
  userId: string;
  lastEventId: string;
  ttlSeconds?: number;
};

export async function acquireReplyLock(args: AcquireReplyLockArgs): Promise<
  | { ok: true; conversationId: string }
  | {
      ok: false;
      reason: "conflict" | "locked";
      lockedByUserId?: string;
      expiresAt?: Date;
      currentLastEventId?: string;
    }
> {
  const ttlSeconds = args.ttlSeconds ?? 45;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  return await prisma.$transaction(async (tx) => {
    const convo = await tx.conversation.findUnique({
      where: { id: args.conversationId },
      select: { id: true, brandId: true },
    });
    if (!convo) throw new Error("Conversation not found");
    if (convo.brandId !== args.brandId) throw new Error("Cross-brand access denied");

    const last = await tx.timelineEvent.findFirst({
      where: { conversationId: args.conversationId },
      orderBy: { timestamp: "desc" },
      select: { id: true },
    });
    const currentLastEventId = last?.id ?? "";
    if (currentLastEventId !== args.lastEventId) {
      return { ok: false as const, reason: "conflict" as const, currentLastEventId };
    }

    const existing = await tx.replyLock.findUnique({
      where: { conversationId: args.conversationId },
      select: { lockedByUserId: true, expiresAt: true, lastEventId: true },
    });
    if (existing && existing.expiresAt > new Date()) {
      return {
        ok: false as const,
        reason: "locked" as const,
        lockedByUserId: existing.lockedByUserId,
        expiresAt: existing.expiresAt,
      };
    }

    await tx.replyLock.upsert({
      where: { conversationId: args.conversationId },
      create: {
        conversationId: args.conversationId,
        brandId: args.brandId,
        lockedByUserId: args.userId,
        lastEventId: args.lastEventId,
        expiresAt,
      },
      update: {
        brandId: args.brandId,
        lockedByUserId: args.userId,
        lastEventId: args.lastEventId,
        expiresAt,
      },
    });

    return { ok: true as const, conversationId: args.conversationId };
  });
}

export async function releaseReplyLock(args: {
  conversationId: string;
  userId: string;
}): Promise<{ ok: true } | { ok: false; reason: "not_owner" | "missing" }> {
  const existing = await prisma.replyLock.findUnique({
    where: { conversationId: args.conversationId },
    select: { lockedByUserId: true },
  });
  if (!existing) return { ok: false, reason: "missing" };
  if (existing.lockedByUserId !== args.userId) return { ok: false, reason: "not_owner" };

  await prisma.replyLock.delete({ where: { conversationId: args.conversationId } });
  return { ok: true };
}

