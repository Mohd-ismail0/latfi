import { prisma } from "@/lib/db";
import { encryptJsonForEvent } from "@/lib/crypto/envelope";
import { normalizeIdentityValue } from "@/lib/ingest/normalize";
import {
  ContactIdentityType,
  Platform,
  TimelineDirection,
  TimelineEventType,
} from "@/generated/prisma";

type ActorIdentity =
  | { type: "EMAIL"; value: string }
  | { type: "LINKEDIN"; value: string }
  | { type: "X"; value: string }
  | { type: "WHATSAPP"; value: string }
  | { type: "PHONE"; value: string };

export type IngestInboundEventArgs = {
  brandId: string;
  channelId: string;
  platform: Platform;
  conversationId?: string;
  sourceId?: string;

  type: Extract<TimelineEventType, "MESSAGE" | "POST" | "COMMENT">;
  timestamp: Date;

  actorIdentity?: ActorIdentity;
  content: unknown;
  rawPayload: unknown;
};

async function getOrgIdForBrand(brandId: string): Promise<string> {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { orgId: true },
  });
  if (!brand) throw new Error("Brand not found");
  return brand.orgId;
}

export async function ingestInboundEvent(args: IngestInboundEventArgs): Promise<{
  conversationId: string;
  timelineEventId: string;
  contactId: string;
}> {
  const orgId = await getOrgIdForBrand(args.brandId);

  return await prisma.$transaction(async (tx) => {
    const conversation =
      args.conversationId
        ? await tx.conversation.findUnique({ where: { id: args.conversationId } })
        : null;

    const conversationId =
      conversation?.id ??
      (
        await tx.conversation.create({
          data: { brandId: args.brandId },
          select: { id: true },
        })
      ).id;

    const { contactId } = await (async () => {
      // use non-transaction prisma for identity lookups to keep simple? no: keep tx
      if (args.actorIdentity) {
        const normalizedValue = normalizeIdentityValue(args.actorIdentity.type, args.actorIdentity.value);
        const existing = await tx.contactIdentity.findUnique({
          where: {
            orgId_type_normalizedValue: {
              orgId,
              type: args.actorIdentity.type as ContactIdentityType,
              normalizedValue,
            },
          },
          select: { contactId: true },
        });
        if (existing) {
          await tx.contactBrand.upsert({
            where: { contactId_brandId: { contactId: existing.contactId, brandId: args.brandId } },
            create: { contactId: existing.contactId, brandId: args.brandId },
            update: {},
          });
          return { contactId: existing.contactId };
        }
      }

      const created = await tx.contact.create({
        data: {
          orgId,
          primaryRole: "unknown",
          scope: "BRAND_VISIBLE",
          brands: { create: { brandId: args.brandId } },
          identities: args.actorIdentity
            ? {
                create: {
                  orgId,
                  type: args.actorIdentity.type as ContactIdentityType,
                  value: args.actorIdentity.value,
                  normalizedValue: normalizeIdentityValue(args.actorIdentity.type, args.actorIdentity.value),
                },
              }
            : undefined,
        },
        select: { id: true },
      });
      return { contactId: created.id };
    })();

    // Maintain a mutable "current mapping" for the conversation.
    await tx.conversationContact.upsert({
      where: { conversationId_contactId: { conversationId, contactId } },
      create: { conversationId, contactId },
      update: {},
    });

    const event = await tx.timelineEvent.create({
      data: {
        brandId: args.brandId,
        conversationId,
        contactId,
        channelId: args.channelId,
        platform: args.platform,
        type: args.type as TimelineEventType,
        direction: TimelineDirection.INBOUND,
        contentEncrypted: encryptJsonForEvent(args.content),
        rawPayloadEncrypted: encryptJsonForEvent(args.rawPayload),
        sourceId: args.sourceId,
        timestamp: args.timestamp,
      },
      select: { id: true },
    });

    return { conversationId, timelineEventId: event.id, contactId };
  });
}

