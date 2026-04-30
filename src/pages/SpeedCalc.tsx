import { useState } from "react";
import { Gauge } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SpeedCalc() {
  const [distM, setDistM] = useState("");
  const [mins, setMins] = useState("");
  const [secs, setSecs] = useState("");
  const [out, setOut] = useState<{ mpm: number; ypm: number; kmh: number } | null>(null);

  function calc() {
    const d = parseFloat(distM);
    const t = parseFloat(mins) + parseFloat(secs || "0") / 60;
    if (!d || !t) { setOut(null); return; }
    const mpm = d / t;
    setOut({ mpm, ypm: mpm * 1.09361, kmh: (mpm * 60) / 1000 });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Gauge className="h-5 w-5" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Speed Calculator</h1>
          <p className="text-muted-foreground">Velocidad a partir de distancia y tiempo.</p>
        </div>
      </div>
      <Card><CardContent className="grid gap-3 p-6 sm:grid-cols-3">
        <div className="space-y-1.5"><Label>Distancia (m)</Label><Input value={distM} onChange={(e) => setDistM(e.target.value)} type="number" placeholder="500000" /></div>
        <div className="space-y-1.5"><Label>Minutos</Label><Input value={mins} onChange={(e) => setMins(e.target.value)} type="number" placeholder="370" /></div>
        <div className="space-y-1.5"><Label>Segundos</Label><Input value={secs} onChange={(e) => setSecs(e.target.value)} type="number" placeholder="0" /></div>
      </CardContent></Card>
      <Button onClick={calc}>Calcular</Button>
      {out && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-6"><p className="text-xs uppercase text-muted-foreground">m/min</p><p className="text-2xl font-bold text-primary">{out.mpm.toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-xs uppercase text-muted-foreground">yards/min</p><p className="text-2xl font-bold">{out.ypm.toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-xs uppercase text-muted-foreground">km/h</p><p className="text-2xl font-bold">{out.kmh.toFixed(2)}</p></CardContent></Card>
        </div>
      )}
    </div>
  );
}
