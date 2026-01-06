import crypto from "node:crypto";
import { PrismaClient, Platform } from "../src/generated/prisma";
import { encryptJsonForEvent } from "../src/lib/crypto/envelope";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.org.upsert({
    where: { id: "org_demo" },
    create: { id: "org_demo", name: "Demo Org" },
    update: {},
    select: { id: true },
  });

  const user = await prisma.user.upsert({
    where: { orgId_email: { orgId: org.id, email: "demo@internal.local" } },
    create: { orgId: org.id, email: "demo@internal.local" },
    update: {},
    select: { id: true },
  });

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, displayName: "Demo User", designation: "Principal Engineer" },
    update: {},
  });

  const brand = await prisma.brand.upsert({
    where: { id: "brand_demo" },
    create: { id: "brand_demo", orgId: org.id, name: "Demo Brand" },
    update: {},
    select: { id: true },
  });

  const channel = await prisma.channel.upsert({
    where: { id: "channel_demo_email" },
    create: {
      id: "channel_demo_email",
      brandId: brand.id,
      platform: Platform.EMAIL,
      nickname: "Demo Email",
      authMethod: "API_KEY",
      status: "ACTIVE",
      credentialsEncrypted: encryptJsonForEvent({ kind: "demo" }),
    },
    update: {},
    select: { id: true },
  });

  const conversation = await prisma.conversation.upsert({
    where: { id: "convo_demo_1" },
    create: { id: "convo_demo_1", brandId: brand.id },
    update: {},
    select: { id: true },
  });

  // Create a known contact and 1 inbound event.
  const contact = await prisma.contact.create({
    data: {
      orgId: org.id,
      primaryRole: "unknown",
      scope: "BRAND_VISIBLE",
      brands: { create: { brandId: brand.id } },
      identities: {
        create: {
          orgId: org.id,
          type: "EMAIL",
          value: "someone@example.com",
          normalizedValue: "someone@example.com",
        },
      },
    },
    select: { id: true },
  });

  await prisma.conversationContact.upsert({
    where: { conversationId_contactId: { conversationId: conversation.id, contactId: contact.id } },
    create: { conversationId: conversation.id, contactId: contact.id },
    update: {},
  });

  const sourceId = crypto.randomUUID();
  await prisma.timelineEvent.create({
    data: {
      brandId: brand.id,
      conversationId: conversation.id,
      contactId: contact.id,
      channelId: channel.id,
      platform: Platform.EMAIL,
      type: "MESSAGE",
      direction: "INBOUND",
      contentEncrypted: encryptJsonForEvent({ text: "Hello — can we get a quick update?" }),
      rawPayloadEncrypted: encryptJsonForEvent({ provider: "demo", messageId: sourceId }),
      sourceId,
      timestamp: new Date(),
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

