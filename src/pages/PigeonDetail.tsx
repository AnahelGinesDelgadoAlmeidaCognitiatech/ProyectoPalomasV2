import { Link, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MessageSquarePlus, Pill, Trophy, Plus, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PedigreeTree } from "@/components/PedigreeTree";
import { db } from "@/lib/db";
import { calculateCOI } from "@/lib/genetics";
import { toast } from "sonner";

export default function PigeonDetail() {
  const { id } = useParams();
  const pigeon = useLiveQuery(() => (id ? db.pigeons.get(id) : undefined), [id]);
  const allPigeons = useLiveQuery(() => db.pigeons.toArray(), []) ?? [];
  const { t } = useTranslation();

  if (pigeon === undefined) {
    return <div className="py-20 text-center text-muted-foreground">{t("pigeon_detail.loading")}</div>;
  }

  if (!pigeon) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{t("pigeon_detail.not_found")}</p>
        <Button asChild variant="link"><Link to="/pigeons">{t("pigeon_detail.back")}</Link></Button>
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

  const parents = allPigeons.filter((p) => p.id === pigeon.fatherId || p.id === pigeon.motherId);

  const inbreeding = calculateCOI(pigeon, allPigeons).toFixed(2);

  const rating = (pigeon.wins ?? 0) * 8 + 30;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
        <Link to="/pigeons"><ArrowLeft className="h-4 w-4" /> {t("pigeon_detail.back")}</Link>
      </Button>

      {/* Header card */}
      <Card className="overflow-hidden shadow-card">
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <div className="aspect-square overflow-hidden bg-secondary md:aspect-auto">
            {pigeon.image ? (
              <img src={pigeon.image} alt={pigeon.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">{t("pigeons.no_image")}</div>
            )}
          </div>
          <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase text-muted-foreground">{pigeon.bornYear} {pigeon.ringNumber} {pigeon.sex.toUpperCase()}</p>
                <h1 className="mt-1 text-3xl font-bold">{pigeon.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{pigeon.color} · {pigeon.loft}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="border-0 capitalize bg-primary/10 text-primary">{t(`status.${pigeon.status}`)}</Badge>
                <Badge variant="secondary" className="border-0 bg-accent/10 text-accent">{Math.min(rating, 100)}/100</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label={t("pigeon_detail.wins")} value={String(pigeon.wins ?? 0)} />
              <Stat label={t("pigeon_detail.races")} value={String(pigeon.races ?? 0)} />
              <Stat label={t("pigeon_detail.children")} value={String(children.length)} />
              <Stat label={t("pigeon_detail.inbreeding")} value={`${inbreeding}%`} />
            </div>

            <div className="mt-auto flex flex-wrap gap-2">
              <Button asChild size="sm" className="gap-1.5">
                <Link to={`/pigeons/${pigeon.id}/edit`}><Pencil className="h-3.5 w-3.5" /> {t("pigeon_detail.edit")}</Link>
              </Button>
              <Button size="sm" variant="outline" disabled>{t("pigeon_detail.pdf")}</Button>
              <Button size="sm" variant="outline" disabled>{t("pigeon_detail.add_image")}</Button>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">{t("pigeon_detail.tab_overview")}</TabsTrigger>
          <TabsTrigger value="pedigree">{t("pigeon_detail.tab_pedigree")}</TabsTrigger>
          <TabsTrigger value="races">{t("pigeon_detail.tab_race_history")}</TabsTrigger>
          <TabsTrigger value="medications">{t("pigeon_detail.tab_medications")}</TabsTrigger>
          <TabsTrigger value="comments">{t("pigeon_detail.tab_comments")}</TabsTrigger>
          <TabsTrigger value="related">{t("pigeon_detail.tab_related")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 grid gap-6 lg:grid-cols-2">
          <InfoCard title={t("pigeon_detail.basic_info")} rows={[
            [t("pigeon_detail.name"), pigeon.name],
            [t("pigeon_detail.dob"), `${pigeon.bornYear}`],
            [t("pigeon_detail.sex"), pigeon.sex === "cock" ? t("pigeon_detail.cock") : t("pigeon_detail.hen")],
            [t("pigeon_detail.id_band"), pigeon.ringNumber],
            [t("pigeon_detail.trail_band"), "—"],
          ]} />
          <InfoCard title={t("pigeon_detail.meta_info")} rows={[
            [t("sidebar.stations_group").slice(0, -1), pigeon.status], // Temporary fix
            [t("pigeon_detail.location"), pigeon.loft],
            [t("pigeon_detail.family"), "Klein Dirk"],
            [t("pigeon_detail.last_owner"), "—"],
            [t("pigeon_detail.rating"), `${Math.min(rating, 100)}/100`],
            [t("pigeon_detail.tags"), "—"],
          ]} />
          <InfoCard title={t("pigeon_detail.color_info")} rows={[
            [t("autocomplete.cat_color").slice(0, -1), pigeon.color],
            [t("pigeon_detail.eye"), "Orange"],
            [t("pigeon_detail.leg"), "—"],
            [t("pigeon_detail.markings"), "—"],
          ]} />
          <InfoCard title={t("pigeon_detail.genetics")} rows={[
            [t("pigeon_detail.base_color"), "Blue"],
            [t("pigeon_detail.carried_color"), "—"],
            [t("pigeon_detail.patterns"), "Bar"],
            [t("pigeon_detail.carried_patterns"), "—"],
            [t("pigeon_detail.spread"), "—"],
            [t("pigeon_detail.dilute"), "—"],
            [t("pigeon_detail.grizzle"), "—"],
            [t("pigeon_detail.recessive_red"), "—"],
          ]} />
          <Card className="lg:col-span-2 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">{t("pigeon_detail.coi")}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="text-3xl font-bold text-primary">{inbreeding}%</p>
                <p className="text-xs text-muted-foreground">{t("pigeon_detail.calc_5_gen")}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  toast.success(t("pigeon_detail.recalculate_success") || "Cálculo actualizado");
                }}
              >
                {t("pigeon_detail.recalculate")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pedigree" className="mt-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">{t("pigeon_detail.pedigree_3_gen")}</CardTitle>
            </CardHeader>
            <CardContent>
              <PedigreeTree rootId={pigeon.id} />
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-1 rounded-sm bg-primary" /> {t("pigeon_detail.cock_line")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-1 rounded-sm bg-accent" /> {t("pigeon_detail.hen_line")}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="races" className="mt-6">
          <Card className="shadow-soft">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-accent" /> {t("pigeon_detail.tab_race_history")}</CardTitle>
              <Button size="sm" variant="outline">{t("pigeon_detail.create_race")}</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3">{t("pigeon_detail.race")}</th>
                      <th className="py-2 pr-3">{t("pigeon_detail.date")}</th>
                      <th className="py-2 pr-3">{t("pigeon_detail.distance")}</th>
                      <th className="py-2 pr-3">{t("pigeon_detail.total_birds")}</th>
                      <th className="py-2 pr-3">{t("pigeon_detail.arrived")}</th>
                      <th className="py-2 pr-3">{t("pigeon_detail.place")}</th>
                      <th className="py-2 pr-3">{t("pigeon_detail.avg_speed")}</th>
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
              <CardTitle className="text-lg flex items-center gap-2"><Pill className="h-5 w-5 text-primary" /> {t("pigeon_detail.tab_medications")}</CardTitle>
              <Button size="sm" variant="outline">{t("pigeon_detail.add_medication")}</Button>
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
              <CardTitle className="text-lg flex items-center gap-2"><MessageSquarePlus className="h-5 w-5 text-primary" /> {t("pigeon_detail.tab_comments")}</CardTitle>
              <Button size="sm" variant="outline">{t("pigeon_detail.add_comment")}</Button>
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
          <RelatedGroup title={t("pigeon_detail.parents")} items={parents} />
          <RelatedGroup title={t("pigeon_detail.children")} items={children} />
          <RelatedGroup title={t("pigeon_detail.full_siblings")} items={fullSiblings} />
          <RelatedGroup title={t("pigeon_detail.half_siblings_sire")} items={halfSiblings.filter((p) => p.fatherId === pigeon.fatherId)} />
          <RelatedGroup title={t("pigeon_detail.half_siblings_dam")} items={halfSiblings.filter((p) => p.motherId === pigeon.motherId)} />
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

function RelatedGroup({ title, items }: { title: string; items: { id: string; name: string; ringNumber: string; image?: string }[] }) {
  const { t } = useTranslation();
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle className="text-base">{title} <span className="text-muted-foreground font-normal">({items.length})</span></CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("pigeon_detail.none_recorded")}</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <Link key={p.id} to={`/pigeons/${p.id}`} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2 transition-smooth hover:bg-secondary">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-10 w-10 rounded-md object-cover" loading="lazy" />
                ) : (
                  <div className="h-10 w-10 rounded-md bg-secondary" />
                )}
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
