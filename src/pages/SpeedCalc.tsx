import { useState } from "react";
import { Gauge } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SpeedCalc() {
  const [distM, setDistM] = useState("");
  const [mins, setMins] = useState("");
  const [secs, setSecs] = useState("");
  const [out, setOut] = useState<{ mpm: number; ypm: number; kmh: number } | null>(null);
  const { t } = useTranslation();

  function calc() {
    const d = parseFloat(distM);
    const t_val = parseFloat(mins) + parseFloat(secs || "0") / 60;
    if (!d || !t_val) { setOut(null); return; }
    const mpm = d / t_val;
    setOut({ mpm, ypm: mpm * 1.09361, kmh: (mpm * 60) / 1000 });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Gauge className="h-5 w-5" /></div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("speed_calc.title")}</h1>
          <p className="text-muted-foreground">{t("speed_calc.desc")}</p>
        </div>
      </div>
      <Card><CardContent className="grid gap-3 p-6 sm:grid-cols-3">
        <div className="space-y-1.5"><Label>{t("speed_calc.dist")}</Label><Input value={distM} onChange={(e) => setDistM(e.target.value)} type="number" placeholder="500000" /></div>
        <div className="space-y-1.5"><Label>{t("speed_calc.mins")}</Label><Input value={mins} onChange={(e) => setMins(e.target.value)} type="number" placeholder="370" /></div>
        <div className="space-y-1.5"><Label>{t("speed_calc.secs")}</Label><Input value={secs} onChange={(e) => setSecs(e.target.value)} type="number" placeholder="0" /></div>
      </CardContent></Card>
      <Button onClick={calc}>{t("speed_calc.calc_btn")}</Button>
      {out && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-6"><p className="text-xs uppercase text-muted-foreground">{t("speed_calc.mpm")}</p><p className="text-2xl font-bold text-primary">{out.mpm.toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-xs uppercase text-muted-foreground">{t("speed_calc.ypm")}</p><p className="text-2xl font-bold">{out.ypm.toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-xs uppercase text-muted-foreground">{t("speed_calc.kmh")}</p><p className="text-2xl font-bold">{out.kmh.toFixed(2)}</p></CardContent></Card>
        </div>
      )}
    </div>
  );
}
