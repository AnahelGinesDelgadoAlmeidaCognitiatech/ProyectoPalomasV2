import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { Trophy, Clock, ArrowLeft, Plus, Trash2, Gauge } from "lucide-react";
import { db, saveAndSync, type Race, type Pigeon } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function RaceResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const race = useLiveQuery(() => db.races.get(id || ""), [id]);
  const teams = useLiveQuery(() => db.teams.toArray());
  const allPigeons = useLiveQuery(() => db.pigeons.toArray());

  const [selectedPigeon, setSelectedPigeon] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");

  if (!race || !allPigeons || !teams) return <div className="p-8 text-center">Loading...</div>;

  // Filter pigeons based on the race's team
  const raceTeam = teams.find(t => t.id === race.teamId);
  const participatingPigeons = race.teamId 
    ? allPigeons.filter(p => raceTeam?.pigeonIds.includes(p.id))
    : allPigeons;

  const currentResults = race.results || [];

  const handleAddResult = async () => {
    if (!selectedPigeon || !arrivalTime) {
      toast.error(t("common.error"));
      return;
    }

    // Check if pigeon already has a result
    if (currentResults.some(r => r.pigeonId === selectedPigeon)) {
      toast.error(t("common.error"));
      return;
    }

    let speed = 0;
    if (race.liberationTime && race.distanceKm) {
      const [libH, libM] = race.liberationTime.split(":").map(Number);
      const [arrH, arrM] = arrivalTime.split(":").map(Number);
      
      const libTotal = libH * 60 + libM;
      let arrTotal = arrH * 60 + arrM;
      
      // If arrival is earlier than liberation, assume next day (+24h)
      if (arrTotal <= libTotal) arrTotal += 24 * 60;
      
      const diffMin = arrTotal - libTotal;
      if (diffMin > 0) {
        speed = (race.distanceKm * 1000) / diffMin;
      }
    }

    const newResults = [...currentResults, {
      pigeonId: selectedPigeon,
      arrivalTime,
      speed: Number(speed.toFixed(2)),
      position: 0 // Will recalculate all positions below
    }];

    // Sort by speed and assign positions
    newResults.sort((a, b) => (b.speed || 0) - (a.speed || 0));
    newResults.forEach((r, idx) => { r.position = idx + 1; });

    try {
      await saveAndSync(db.races, "race", { ...race, results: newResults }, false);
      toast.success(t("pigeon_edit.save_updated"));
      setSelectedPigeon("");
      setArrivalTime("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  };

  const removeResult = async (pigeonId: string) => {
    const newResults = currentResults.filter(r => r.pigeonId !== pigeonId);
    newResults.sort((a, b) => (b.speed || 0) - (a.speed || 0));
    newResults.forEach((r, idx) => { r.position = idx + 1; });

    await saveAndSync(db.races, "race", { ...race, results: newResults }, false);
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 pb-24">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{race.name}</h1>
          <p className="text-sm text-muted-foreground">{race.date}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Race Info */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {t("sidebar.races")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("crud_pages.races.field_time")}:</span>
              <span className="font-medium">{race.liberationTime || "--:--"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("crud_pages.races.field_distance")}:</span>
              <span className="font-medium">{race.distanceKm ? `${race.distanceKm} km` : "---"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Add Result Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{t("crud_pages.races.add_result")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label>{t("crud_pages.races.select_pigeon")}</Label>
                <Select value={selectedPigeon} onValueChange={setSelectedPigeon}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("crud_pages.races.select_pigeon")} />
                  </SelectTrigger>
                  <SelectContent>
                    {participatingPigeons?.filter(p => !currentResults.some(r => r.pigeonId === p.id)).map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.ringNumber} - {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full space-y-2 sm:w-32">
                <Label>{t("crud_pages.races.arrival_time")}</Label>
                <Input 
                  type="time" 
                  step="1"
                  value={arrivalTime} 
                  onChange={(e) => setArrivalTime(e.target.value)} 
                />
              </div>
              <Button onClick={handleAddResult} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                {t("common.add")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results List */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">{t("crud_pages.races.register_results")}</h2>
        
        {currentResults.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            {t("crud_pages.races.no_results")}
          </div>
        ) : (
          <div className="grid gap-3">
            {currentResults.map((res) => {
              const pigeon = allPigeons?.find(p => p.id === res.pigeonId);
              return (
                <Card key={res.pigeonId} className="overflow-hidden border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                          {res.position}º
                        </div>
                        <div>
                          <p className="font-bold">{pigeon?.ringNumber || "???"}</p>
                          <p className="text-xs text-muted-foreground">{pigeon?.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3" /> {t("crud_pages.races.arrival_time")}
                          </p>
                          <p className="font-mono font-semibold">{res.arrivalTime}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <Gauge className="h-3 w-3" /> {t("crud_pages.races.speed")}
                          </p>
                          <p className="font-mono text-lg font-bold text-primary">
                            {res.speed} <span className="text-[10px] font-normal text-muted-foreground">m/m</span>
                          </p>
                        </div>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => removeResult(res.pigeonId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
