import { prisma } from "@/lib/db";
import { decryptJsonForEvent, type EncryptedBlobV1 } from "@/lib/crypto/envelope";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Timeline } from "@/components/timeline/Timeline";
import { ReplyComposer } from "@/components/layout/ReplyComposer";

function asText(payload: unknown): string {
  if (payload == null) return "";
  if (typeof payload === "string") return payload;
  if (typeof payload === "object") return JSON.stringify(payload, null, 2);
  return String(payload);
}

export default async function ConversationPage(props: {
  params: Promise<{ orgId: string; brandId: string; conversationId: string }>;
}) {
  const { orgId, brandId, conversationId } = await props.params;

  const brand = await prisma.brand.findFirst({
    where: { id: brandId, orgId },
    select: { id: true, name: true },
  });
  if (!brand) return <div className="text-sm text-zinc-600">Brand not found.</div>;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, brandId: brand.id },
    select: { id: true },
  });
  if (!conversation) return <div className="text-sm text-zinc-600">Conversation not found.</div>;

  const events = await prisma.timelineEvent.findMany({
    where: { conversationId: conversation.id },
    orderBy: { timestamp: "asc" },
    select: {
      id: true,
      type: true,
      direction: true,
      timestamp: true,
      signature: true,
      contentEncrypted: true,
    },
  });

  const items = events.map((e) => {
    const content = decryptJsonForEvent(e.contentEncrypted as EncryptedBlobV1);
    return {
      id: e.id,
      type: e.type,
      direction: e.direction,
      timestampLabel: new Date(e.timestamp).toLocaleString(),
      title: `${e.type} · ${e.direction}`,
      body: asText(content),
      signature: e.signature,
    };
  });

  const lastEventId = events.length ? events[events.length - 1]!.id : "";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wide text-zinc-500">{brand.name}</div>
        <div className="text-2xl font-semibold">Conversation timeline</div>
      </div>

      <Card>
        <CardHeader>
          <div className="text-sm font-medium">Timeline (append-only)</div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-sm text-zinc-600">No events yet.</div>
          ) : (
            <Timeline items={items} />
          )}
        </CardContent>
      </Card>

      <ReplyComposer
        brandId={brandId}
        conversationId={conversationId}
        lastEventId={lastEventId}
      />
    </div>
  );
}

