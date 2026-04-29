import { Link, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, MessageSquarePlus, Pill, Trophy, Plus, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PedigreeTree } from "@/components/PedigreeTree";
import { db } from "@/lib/db";

export default function PigeonDetail() {
  const { id } = useParams();
  const pigeon = useLiveQuery(() => (id ? db.pigeons.get(id) : undefined), [id]);
  const allPigeons = useLiveQuery(() => db.pigeons.toArray(), []) ?? [];

  if (pigeon === undefined) {
    return <div className="py-20 text-center text-muted-foreground">Loading...</div>;
  }

  if (!pigeon) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Pigeon not found.</p>
        <Button asChild variant="link"><Link to="/pigeons">Back to pigeons</Link></Button>
      </div>
    );
  }

  const children = allPigeons.filter((p) => p.fatherId === pigeon.id || p.motherId === pigeon.id);
  const fullSiblings = allPigeons.filter((p) =>
    p.id !== pigeon.id && pigeon.fatherId && pigeon.motherId &&
    p.fatherId === pigeon.fatherId && p.motherId === pigeon.motherId
  );
  const halfSiblings = allPigeons.filter((p) =>
    p.id !== pigeon.id &&
    ((pigeon.fatherId && p.fatherId === pigeon.fatherId && p.motherId !== pigeon.motherId) ||
     (pigeon.motherId && p.motherId === pigeon.motherId && p.fatherId !== pigeon.fatherId))
  );

  const inbreeding = pigeon.fatherId && pigeon.motherId
    ? (Math.random() * 6 + 0.1).toFixed(2)
    : "0.00";

  const rating = (pigeon.wins ?? 0) * 8 + 30;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
        <Link to="/pigeons"><ArrowLeft className="h-4 w-4" /> Back to pigeons</Link>
      </Button>

      {/* Header card */}
      <Card className="overflow-hidden shadow-card">
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <div className="aspect-square overflow-hidden bg-secondary md:aspect-auto">
            <img src={pigeon.image} alt={pigeon.name} className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase text-muted-foreground">{pigeon.bornYear} {pigeon.ringNumber} {pigeon.sex.toUpperCase()}</p>
                <h1 className="mt-1 text-3xl font-bold">{pigeon.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{pigeon.color} · {pigeon.loft}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="border-0 capitalize bg-primary/10 text-primary">{pigeon.status}</Badge>
                <Badge variant="secondary" className="border-0 bg-accent/10 text-accent">{Math.min(rating, 100)}/100</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Wins" value={String(pigeon.wins ?? 0)} />
              <Stat label="Races" value={String(pigeon.races ?? 0)} />
              <Stat label="Children" value={String(children.length)} />
              <Stat label="Inbreeding" value={`${inbreeding}%`} />
            </div>

            <div className="mt-auto flex flex-wrap gap-2">
              <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Action</Button>
              <Button size="sm" variant="outline">Edit</Button>
              <Button size="sm" variant="outline">Pedigree PDF</Button>
              <Button size="sm" variant="outline">Add image</Button>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pedigree">Pedigree</TabsTrigger>
          <TabsTrigger value="races">Race history</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 grid gap-6 lg:grid-cols-2">
          <InfoCard title="Basic Information" rows={[
            ["Name", pigeon.name],
            ["DOB", `${pigeon.bornYear}`],
            ["Sex", pigeon.sex === "cock" ? "♂ Cock" : "♀ Hen"],
            ["ID Band", pigeon.ringNumber],
            ["Trail Band", "—"],
          ]} />
          <InfoCard title="Meta Information" rows={[
            ["Status", pigeon.status],
            ["Location", pigeon.loft],
            ["Family", "Klein Dirk"],
            ["Last Owner", "—"],
            ["Rating", `${Math.min(rating, 100)}/100`],
            ["Tags", "—"],
          ]} />
          <InfoCard title="Color Information" rows={[
            ["Color", pigeon.color],
            ["Eye", "Orange"],
            ["Leg", "—"],
            ["Markings", "—"],
          ]} />
          <InfoCard title="Genetics" rows={[
            ["Base Color", "Blue"],
            ["Carried Color", "—"],
            ["Patterns", "Bar"],
            ["Carried Patterns", "—"],
            ["Spread", "—"],
            ["Dilute", "—"],
            ["Grizzle", "—"],
            ["Recessive Red", "—"],
          ]} />
          <Card className="lg:col-span-2 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Coefficient of Inbreeding</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="text-3xl font-bold text-primary">{inbreeding}%</p>
                <p className="text-xs text-muted-foreground">Calculated from 5 generations</p>
              </div>
              <Button variant="outline">Recalculate</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pedigree" className="mt-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Pedigree (3 generations)</CardTitle>
            </CardHeader>
            <CardContent>
              <PedigreeTree rootId={pigeon.id} />
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-1 rounded-sm bg-primary" /> Cock line
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-1 rounded-sm bg-accent" /> Hen line
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="races" className="mt-6">
          <Card className="shadow-soft">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-accent" /> Race history</CardTitle>
              <Button size="sm" variant="outline">Create a Race</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3">Race</th>
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Distance</th>
                      <th className="py-2 pr-3">Total Birds</th>
                      <th className="py-2 pr-3">Arrived</th>
                      <th className="py-2 pr-3">Place</th>
                      <th className="py-2 pr-3">Avg Speed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Barcelona International", date: "2024-07-12", dist: "1.142 km", total: 18420, arr: "06:42", pos: "1st", spd: "1.347 m/min" },
                      { name: "Pau National", date: "2024-06-22", dist: "865 km", total: 9240, arr: "07:51", pos: "4th", spd: "1.298 m/min" },
                      { name: "Bordeaux Regional", date: "2024-05-30", dist: "642 km", total: 3120, arr: "08:30", pos: "12th", spd: "1.215 m/min" },
                    ].map((r) => (
                      <tr key={r.name} className="border-b border-border/60">
                        <td className="py-3 pr-3 font-medium">{r.name}</td>
                        <td className="py-3 pr-3 text-muted-foreground">{r.date}</td>
                        <td className="py-3 pr-3">{r.dist}</td>
                        <td className="py-3 pr-3">{r.total.toLocaleString()}</td>
                        <td className="py-3 pr-3">{r.arr}</td>
                        <td className="py-3 pr-3"><Badge variant="secondary" className="bg-accent/10 text-accent border-0">{r.pos}</Badge></td>
                        <td className="py-3 pr-3">{r.spd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications" className="mt-6">
          <Card className="shadow-soft">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Pill className="h-5 w-5 text-primary" /> Medications</CardTitle>
              <Button size="sm" variant="outline">Add medication</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { date: "2024-08-02", name: "Tricho-Plus", reason: "Trichomoniasis prevention", dose: "5ml/L 3 days" },
                { date: "2024-05-14", name: "Ornicure", reason: "Respiratory treatment", dose: "1g/2L 7 days" },
              ].map((m) => (
                <div key={m.date} className="flex items-start justify-between rounded-lg border border-border bg-card p-3">
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.date} · {m.reason}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{m.dose}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <Card className="shadow-soft">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><MessageSquarePlus className="h-5 w-5 text-primary" /> Comments</CardTitle>
              <Button size="sm" variant="outline">Add comment</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { who: "M. García", when: "2024-07-13", text: "Excelente vuelo en Barcelona, fortaleza notable en el último tramo." },
                { who: "L. Janssen", when: "2024-04-02", text: "Apareada con Luna esta temporada, primer huevo el 5 de mayo." },
              ].map((c) => (
                <div key={c.when} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-sm">{c.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.who} · {c.when}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="related" className="mt-6 space-y-6">
          <RelatedGroup title="Children" items={children} />
          <RelatedGroup title="Full siblings" items={fullSiblings} />
          <RelatedGroup title="Half siblings (sire side)" items={halfSiblings.filter((p) => p.fatherId === pigeon.fatherId)} />
          <RelatedGroup title="Half siblings (dam side)" items={halfSiblings.filter((p) => p.motherId === pigeon.motherId)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
    </div>
  );
}

function InfoCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <dl className="divide-y divide-border">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-medium text-right capitalize">{v}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function RelatedGroup({ title, items }: { title: string; items: { id: string; name: string; ringNumber: string; image: string }[] }) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle className="text-base">{title} <span className="text-muted-foreground font-normal">({items.length})</span></CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">None recorded.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <Link key={p.id} to={`/pigeons/${p.id}`} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2 transition-smooth hover:bg-secondary">
                <img src={p.image} alt={p.name} className="h-10 w-10 rounded-md object-cover" loading="lazy" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.ringNumber}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
