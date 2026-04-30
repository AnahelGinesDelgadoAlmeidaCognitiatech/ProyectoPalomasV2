import { useState } from "react";
import { Ruler } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DistanceCalc() {
  const [a, setA] = useState({ lat: "", lng: "" });
  const [b, setB] = useState({ lat: "", lng: "" });
  const [result, setResult] = useState<number | null>(null);

  function calc() {
    const la1 = parseFloat(a.lat), lo1 = parseFloat(a.lng);
    const la2 = parseFloat(b.lat), lo2 = parseFloat(b.lng);
    if ([la1, lo1, la2, lo2].some((n) => Number.isNaN(n))) { setResult(null); return; }
    setResult(haversine(la1, lo1, la2, lo2));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Ruler className="h-5 w-5" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Distance Calculator</h1>
          <p className="text-muted-foreground">Distancia great-circle entre palomar y suelta.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">Palomar</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Latitud</Label><Input value={a.lat} onChange={(e) => setA({ ...a, lat: e.target.value })} placeholder="40.4168" /></div>
            <div className="space-y-1.5"><Label>Longitud</Label><Input value={a.lng} onChange={(e) => setA({ ...a, lng: e.target.value })} placeholder="-3.7038" /></div>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-base">Suelta</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Latitud</Label><Input value={b.lat} onChange={(e) => setB({ ...b, lat: e.target.value })} placeholder="41.3851" /></div>
            <div className="space-y-1.5"><Label>Longitud</Label><Input value={b.lng} onChange={(e) => setB({ ...b, lng: e.target.value })} placeholder="2.1734" /></div>
          </CardContent>
        </Card>
      </div>
      <Button onClick={calc}>Calcular</Button>
      {result != null && (
        <Card><CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Distancia</p>
          <p className="text-3xl font-bold text-primary">{result.toFixed(2)} km</p>
          <p className="text-xs text-muted-foreground">{(result * 1000).toFixed(0)} m · {(result * 0.621371).toFixed(2)} mi</p>
        </CardContent></Card>
      )}
    </div>
  );
}
