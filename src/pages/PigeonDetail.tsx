import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Award, Calendar, Home, MapPin, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPigeon } from "@/data/pigeons";
import { PedigreeTree } from "@/components/PedigreeTree";

export default function PigeonDetail() {
  const { id } = useParams();
  const pigeon = getPigeon(id);

  if (!pigeon) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Pigeon not found.</p>
        <Button asChild variant="link"><Link to="/pigeons">Back to pigeons</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link to="/pigeons"><ArrowLeft className="h-4 w-4" /> Back to pigeons</Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 overflow-hidden shadow-card">
          <div className="aspect-square overflow-hidden bg-secondary">
            <img src={pigeon.image} alt={pigeon.name} className="h-full w-full object-cover" />
          </div>
          <CardContent className="space-y-4 p-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{pigeon.name}</h1>
                <Badge variant="secondary" className="border-0 capitalize">{pigeon.status}</Badge>
              </div>
              <p className="font-mono text-sm text-muted-foreground">{pigeon.ringNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Sex" value={pigeon.sex === "cock" ? "♂ Cock" : "♀ Hen"} />
              <Info label="Color" value={pigeon.color} />
              <Info label="Born" value={String(pigeon.bornYear)} icon={Calendar} />
              <Info label="Loft" value={pigeon.loft} icon={Home} />
              <Info label="Breeder" value={pigeon.breeder} icon={MapPin} />
              <Info label="Wins" value={`${pigeon.wins ?? 0} / ${pigeon.races ?? 0}`} icon={Trophy} />
            </div>

            {pigeon.notes && (
              <div className="rounded-lg border border-border bg-gradient-subtle p-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-medium text-primary">
                  <Award className="h-3.5 w-3.5" /> Highlights
                </div>
                <p className="text-sm text-foreground">{pigeon.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Pedigree</CardTitle>
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

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Race history</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { name: "Barcelona International", date: "2024-07-12", pos: "1st", dist: "1.142 km" },
                  { name: "Pau National", date: "2024-06-22", pos: "4th", dist: "865 km" },
                  { name: "Bordeaux Regional", date: "2024-05-30", pos: "12th", dist: "642 km" },
                ].map((r) => (
                  <div key={r.name} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.date} · {r.dist}</p>
                    </div>
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-0">{r.pos}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </div>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
