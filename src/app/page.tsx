export default function Home() {
  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <div className="text-2xl font-semibold">Brand Comms OS</div>
        <div className="text-sm text-zinc-600">
          Timeline-first, append-only communications graph (internal).
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
        Next: connect Postgres + run Prisma migrations + seed demo data, then open a brand inbox
        at <span className="font-mono">/orgs/&lt;orgId&gt;/brands/&lt;brandId&gt;</span>.
      </div>
    </main>
  );
}
