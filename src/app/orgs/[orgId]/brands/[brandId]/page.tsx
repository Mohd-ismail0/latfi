import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function BrandHomePage(props: {
  params: Promise<{ orgId: string; brandId: string }>;
}) {
  const { orgId, brandId } = await props.params;

  const brand = await prisma.brand.findFirst({
    where: { id: brandId, orgId },
    select: { id: true, name: true },
  });
  if (!brand) return <div className="text-sm text-zinc-600">Brand not found.</div>;

  const conversations = await prisma.conversation.findMany({
    where: { brandId: brand.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      events: {
        take: 1,
        orderBy: { timestamp: "desc" },
        select: { id: true, timestamp: true, type: true, direction: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wide text-zinc-500">Brand</div>
        <div className="text-2xl font-semibold">{brand.name}</div>
      </div>

      <Card>
        <CardHeader>
          <div className="text-sm font-medium">Inbox (by conversation)</div>
        </CardHeader>
        <CardContent className="space-y-2">
          {conversations.length === 0 ? (
            <div className="text-sm text-zinc-600">No conversations yet.</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {conversations.map((c) => {
                const last = c.events[0];
                return (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-900 truncate">
                        Conversation {c.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-zinc-600">
                        Last: {last ? `${last.type} ${last.direction}` : "—"}
                      </div>
                    </div>
                    <Link
                      className="text-sm text-zinc-900 underline underline-offset-4"
                      href={`/orgs/${orgId}/brands/${brandId}/conversations/${c.id}`}
                    >
                      Open timeline
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

