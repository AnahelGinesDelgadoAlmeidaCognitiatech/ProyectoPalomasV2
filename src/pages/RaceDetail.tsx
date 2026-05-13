import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { 
  Trophy, Clock, ArrowLeft, Plus, Trash2, Gauge, 
  MapPin, CloudSun, Info, Users, MoreVertical, 
  Archive, QrCode, MessageSquare, ImageIcon, Pencil,
  Search, Check
} from "lucide-react";
import { db, saveAndSync, removeAndSync, type Race, type Pigeon } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function RaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const race = useLiveQuery(() => db.races.get(id || ""), [id]);
  const teams = useLiveQuery(() => db.teams.toArray());
  const allPigeons = useLiveQuery(() => db.pigeons.toArray());
  const stations = useLiveQuery(() => db.stations.toArray());
  const allLofts = useLiveQuery(() => db.lofts.toArray());

  const [selectedPigeon, setSelectedPigeon] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [pigeonsDialogOpen, setPigeonsDialogOpen] = useState(false);
  const [pigeonSearch, setPigeonSearch] = useState("");
  const [editForm, setEditForm] = useState<Partial<Race>>({});

  if (!race || !allPigeons || !teams || !stations || !allLofts) return <div className="p-8 text-center">Loading...</div>;

  const loft = allLofts.find(l => l.isPrimary) || allLofts[0];

  const openEdit = () => {
    setEditForm({ ...race });
    setEditOpen(true);
  };

  // Helper to calculate distance
  const updateDistance = () => {
    // Determine release coordinates
    let relLat = editForm.releasePointLat;
    let relLng = editForm.releasePointLng;
    
    if (!relLat || !relLng) {
      const station = stations.find(s => s.id === editForm.stationId);
      relLat = station?.lat;
      relLng = station?.lng;
    }

    // Determine destination coordinates
    let destLat = editForm.destPointLat;
    let destLng = editForm.destPointLng;

    if (!destLat || !destLng) {
      destLat = loft?.lat;
      destLng = loft?.lng;
    }

    if (!relLat || !relLng || !destLat || !destLng) {
      toast.error("Need coordinates for both release and destination (manual or from station/loft)");
      return;
    }

    const R = 6371; // km
    const dLat = (relLat - destLat) * Math.PI / 180;
    const dLon = (relLng - destLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(destLat * Math.PI / 180) * Math.cos(relLat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    
    setEditForm({
      ...editForm,
      distanceKm: Number(d.toFixed(3)),
      distanceMiles: Number((d * 0.621371).toFixed(3))
    });
    toast.success("Distance updated!");
  };

  const handleSaveEdit = async () => {
    const updatedRace = { ...race, ...editForm } as Race;
    await saveAndSync(db.races, "race", updatedRace, false);
    setEditOpen(false);
    toast.success(t("pigeon_edit.save_updated"));
  };

  const togglePigeonInRace = async (pigeonId: string) => {
    const currentPigeons = race.pigeonIds || [];
    const newPigeons = currentPigeons.includes(pigeonId)
      ? currentPigeons.filter(id => id !== pigeonId)
      : [...currentPigeons, pigeonId];
    
    await saveAndSync(db.races, "race", { ...race, pigeonIds: newPigeons }, false);
  };

  const currentResults = race.results || [];
  const station = stations.find(s => s.id === race.stationId);
  
  const raceTeam = teams.find(t => t.id === race.teamId);
  const participatingPigeons = race.teamId 
    ? allPigeons.filter(p => raceTeam?.pigeonIds?.includes(p.id) || race.pigeonIds?.includes(p.id))
    : allPigeons.filter(p => race.pigeonIds?.includes(p.id));

  const availablePigeons = (participatingPigeons.length > 0) ? participatingPigeons : allPigeons;

  const handleAddResult = async () => {
    if (!selectedPigeon || !arrivalTime) {
      toast.error(t("common.error"));
      return;
    }

    if (currentResults.some(r => r.pigeonId === selectedPigeon)) {
      toast.error(t("common.error"));
      return;
    }

    let speed = 0;
    if (race.liberationTime && race.distanceKm) {
      const parseTime = (t: string) => {
        const parts = t.split(":").map(Number);
        return (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
      };

      const libSecs = parseTime(race.liberationTime);
      let arrSecs = parseTime(arrivalTime);
      
      if (arrSecs <= libSecs) arrSecs += 24 * 3600; // Next day
      
      const diffSeconds = arrSecs - libSecs;
      if (diffSeconds > 0) {
        // Speed in m/m: (distance in meters) / (time in minutes)
        speed = (race.distanceKm * 1000) / (diffSeconds / 60);
      }
    }

    const newResults = [...currentResults, {
      pigeonId: selectedPigeon,
      arrivalTime,
      speed: Number(speed.toFixed(2)),
      position: 0
    }];

    newResults.sort((a, b) => (b.speed || 0) - (a.speed || 0));
    newResults.forEach((r, idx) => { r.position = idx + 1; });

    await saveAndSync(db.races, "race", { ...race, results: newResults }, false);
    setSelectedPigeon("");
    setArrivalTime("");
    toast.success(t("pigeon_edit.save_updated"));
  };

  const deleteRace = async () => {
    if (!confirm(t("pigeon_edit.delete_confirm"))) return;
    await removeAndSync(db.races, "race", race.id);
    navigate("/races");
  };

  return (
    <div className="container mx-auto max-w-6xl p-4 pb-24 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/races")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{race.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={race.archived ? "secondary" : "default"}>
                {race.archived ? t("common.archived") : t("common.active")}
              </Badge>
              <span className="text-sm text-muted-foreground">{race.date}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {t("common.actions")} <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t("crud_pages.races.actions_title")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openEdit} className="gap-2">
                <Pencil className="h-4 w-4" /> {t("crud_pages.races.edit_info")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPigeonsDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> {t("crud_pages.races.add_remove_pigeons")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTeamDialogOpen(true)} className="gap-2">
                <Users className="h-4 w-4" /> {t("crud_pages.races.add_team")}
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="gap-2">
                <MessageSquare className="h-4 w-4" /> {t("crud_pages.races.add_comment")}
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="gap-2">
                <ImageIcon className="h-4 w-4" /> {t("crud_pages.races.add_images")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="gap-2">
                <Archive className="h-4 w-4" /> {t("crud_pages.races.archive_race")}
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="gap-2">
                <QrCode className="h-4 w-4" /> {t("crud_pages.races.qr_code")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={deleteRace} className="gap-2 text-destructive">
                <Trash2 className="h-4 w-4" /> {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> {t("crud_pages.races.basic_info")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("crud_pages.races.race_type")}:</span>
                <span className="font-medium">{race.type || "---"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("crud_pages.races.club_name")}:</span>
                <span className="font-medium">{race.clubName || "---"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("crud_pages.races.combine_name")}:</span>
                <span className="font-medium">{race.combineName || "---"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> {t("crud_pages.races.dist_info")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">{t("crud_pages.races.release_point")}</Label>
                <p className="font-medium">
                  {race.releasePointName || station?.name || "---"}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {(race.releasePointLat || station?.lat)?.toFixed(4)}, {(race.releasePointLng || station?.lng)?.toFixed(4)}
                </p>
              </div>
              <Separator />
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">{t("crud_pages.races.destination_loft")}</Label>
                <p className="font-medium">
                  {race.destPointName || loft?.name || "---"}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {(race.destPointLat || loft?.lat)?.toFixed(4)}, {(race.destPointLng || loft?.lng)?.toFixed(4)}
                </p>
              </div>
              <div className="pt-2 flex justify-between items-end border-t border-dashed">
                <span className="text-muted-foreground">{t("crud_pages.races.distance")}:</span>
                <span className="text-xl font-bold text-primary">
                  {race.distanceKm || "0.0"} <small className="text-[10px] font-normal uppercase">km</small>
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CloudSun className="h-4 w-4 text-primary" /> {t("crud_pages.races.meta_info")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">{t("crud_pages.races.release_conditions")}</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="bg-muted p-2 rounded text-center">
                    <p className="text-[9px] uppercase">{t("crud_pages.races.temperature")}</p>
                    <p className="font-bold">{race.releaseTemp || "---"}</p>
                  </div>
                  <div className="bg-muted p-2 rounded text-center">
                    <p className="text-[9px] uppercase">{t("crud_pages.races.weather_cond")}</p>
                    <p className="font-bold">{race.releaseWeather || "---"}</p>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">{t("crud_pages.races.dest_conditions")}</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="bg-muted p-2 rounded text-center">
                    <p className="text-[9px] uppercase">{t("crud_pages.races.temperature")}</p>
                    <p className="font-bold">{race.destTemp || "---"}</p>
                  </div>
                  <div className="bg-muted p-2 rounded text-center">
                    <p className="text-[9px] uppercase">{t("crud_pages.races.weather_cond")}</p>
                    <p className="font-bold">{race.destWeather || "---"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">{t("crud_pages.races.register_arrival")}</CardTitle>
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
                      {availablePigeons?.filter(p => !currentResults.some(r => r.pigeonId === p.id)).map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.ringNumber} - {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full space-y-2 sm:w-40">
                  <Label>{t("crud_pages.races.arrival_time")}</Label>
                  <Input 
                    type="time" 
                    step="1"
                    value={arrivalTime} 
                    onChange={(e) => setArrivalTime(e.target.value)} 
                  />
                </div>
                <Button onClick={handleAddResult} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> {t("common.add")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {t("crud_pages.races.comp_results")}
              </h2>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                {t("crud_pages.races.release_time")}: {race.liberationTime || "---"}
              </p>
            </div>

            {currentResults.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed p-16 text-center text-muted-foreground">
                <p className="text-lg font-medium">{t("crud_pages.races.no_results")}</p>
                <p className="text-sm mt-2">{t("crud_pages.races.no_birds_desc")}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {currentResults.map((res) => {
                  const pigeon = allPigeons?.find(p => p.id === res.pigeonId);
                  return (
                    <div 
                      key={res.pigeonId} 
                      className="group relative flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary transition-all shadow-sm"
                    >
                      <div className="flex-none flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-xl font-black text-primary border-2 border-primary/20">
                        {res.position}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg truncate uppercase">{pigeon?.ringNumber || "???"}</p>
                        <p className="text-xs text-muted-foreground truncate">{pigeon?.name || "Untitled"}</p>
                      </div>

                      <div className="flex-none grid grid-cols-2 sm:flex items-center gap-8 text-sm">
                        <div className="text-center sm:text-right">
                          <p className="text-[10px] uppercase text-muted-foreground font-bold">{t("crud_pages.races.arrival_time")}</p>
                          <p className="font-mono font-bold text-base">{res.arrivalTime}</p>
                        </div>

                        <div className="text-center sm:text-right">
                          <p className="text-[10px] uppercase text-muted-foreground font-bold italic">{t("crud_pages.races.speed")}</p>
                          <p className="font-black text-xl text-primary leading-none">
                            {res.speed} <span className="text-[10px] font-normal uppercase opacity-70">m/m</span>
                          </p>
                        </div>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 sm:static opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                          const updated = currentResults.filter(r => r.pigeonId !== res.pigeonId);
                          updated.sort((a, b) => (b.speed || 0) - (a.speed || 0));
                          updated.forEach((r, idx) => r.position = idx + 1);
                          await saveAndSync(db.races, "race", { ...race, results: updated }, false);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("crud_pages.races.edit_info")}</DialogTitle>
            <DialogDescription>{t("crud_pages.races.edit_desc")}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8 py-4">
            {/* 1. Release Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">
                {t("crud_pages.races.release_info")}
              </h4>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground italic">
                    {t("crud_pages.races.select_station")}:
                  </Label>
                  <Select 
                    value={editForm.stationId || "none"} 
                    onValueChange={v => {
                      const s = stations.find(st => st.id === v);
                      setEditForm({
                        ...editForm, 
                        stationId: v === "none" ? undefined : v,
                        releasePointName: s?.name || "",
                        releasePointLat: s?.lat,
                        releasePointLng: s?.lng
                      });
                    }}
                  >
                    <SelectTrigger className="h-12 bg-muted/30"><SelectValue placeholder="Select Station" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- {t("crud_pages.races.no_team_opt")} --</SelectItem>
                      {stations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-dashed">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">{t("crud_pages.races.point_name")}:</Label>
                    <Input 
                      className="bg-background"
                      value={editForm.releasePointName || ""} 
                      onChange={e => setEditForm({...editForm, releasePointName: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">{t("crud_pages.races.coordinates")}:</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder={t("crud_pages.races.latitude")}
                        type="number" step="0.000001" 
                        value={editForm.releasePointLat ?? ""} 
                        onChange={e => setEditForm({...editForm, releasePointLat: e.target.value === "" ? undefined : Number(e.target.value)})} 
                      />
                      <Input 
                        placeholder={t("crud_pages.races.longitude")}
                        type="number" step="0.000001" 
                        value={editForm.releasePointLng ?? ""} 
                        onChange={e => setEditForm({...editForm, releasePointLng: e.target.value === "" ? undefined : Number(e.target.value)})} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Destination Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">
                {t("crud_pages.races.dest_info_title")}
              </h4>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground italic">
                    {t("crud_pages.races.select_loft")}:
                  </Label>
                  <Select 
                    value={editForm.destPointLat && editForm.destPointLng ? "manual" : "none"} 
                    onValueChange={v => {
                      if (v === "none") {
                        setEditForm({...editForm, destPointName: "", destPointLat: undefined, destPointLng: undefined});
                      } else {
                        const l = (v === "primary" ? loft : allLofts?.find(loftItem => loftItem.id === v));
                        setEditForm({
                          ...editForm,
                          destPointName: l?.name || "",
                          destPointLat: l?.lat,
                          destPointLng: l?.lng
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-12 bg-muted/30"><SelectValue placeholder="Select Destination" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- {t("crud_pages.races.no_team_opt")} --</SelectItem>
                      <SelectItem value="primary">{t("sidebar.my_loft")} (Primary)</SelectItem>
                      {allLofts?.filter(l => !l.isPrimary).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-dashed">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">{t("crud_pages.races.point_name")}:</Label>
                    <Input 
                      className="bg-background"
                      value={editForm.destPointName || ""} 
                      onChange={e => setEditForm({...editForm, destPointName: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">{t("crud_pages.races.coordinates")}:</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder={t("crud_pages.races.latitude")}
                        type="number" step="0.000001" 
                        value={editForm.destPointLat ?? ""} 
                        onChange={e => setEditForm({...editForm, destPointLat: e.target.value === "" ? undefined : Number(e.target.value)})} 
                      />
                      <Input 
                        placeholder={t("crud_pages.races.longitude")}
                        type="number" step="0.000001" 
                        value={editForm.destPointLng ?? ""} 
                        onChange={e => setEditForm({...editForm, destPointLng: e.target.value === "" ? undefined : Number(e.target.value)})} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Distance Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">
                {t("crud_pages.races.dist_info_title")}
              </h4>
              <div className="space-y-4 bg-primary/5 p-4 rounded-xl border border-primary/20">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-muted-foreground italic">
                    {t("crud_pages.races.dist_calc_desc")}:
                  </Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={updateDistance}
                  >
                    <Gauge className="h-4 w-4" /> {t("crud_pages.races.auto_calc")}
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">KM</Label>
                    <Input 
                      type="number" step="0.001"
                      className="text-lg font-bold"
                      value={editForm.distanceKm ?? ""} 
                      onChange={e => setEditForm({...editForm, distanceKm: e.target.value === "" ? undefined : Number(e.target.value)})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">Miles</Label>
                    <Input 
                      type="number" step="0.001"
                      className="text-lg font-bold"
                      value={editForm.distanceMiles ?? ""} 
                      onChange={e => setEditForm({...editForm, distanceMiles: e.target.value === "" ? undefined : Number(e.target.value)})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">{t("crud_pages.races.field_time")}</Label>
                    <Input 
                      type="time" step="1" 
                      className="text-lg font-bold"
                      value={editForm.liberationTime || ""} 
                      onChange={e => setEditForm({...editForm, liberationTime: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Competition Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">
                {t("crud_pages.races.comp_info")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold">{t("crud_pages.races.field_name")}</Label>
                  <Input value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">{t("crud_pages.races.field_team")}</Label>
                  <Select value={editForm.teamId || "none"} onValueChange={v => setEditForm({...editForm, teamId: v === "none" ? undefined : v})}>
                    <SelectTrigger><SelectValue placeholder="Select Team" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- {t("crud_pages.races.no_team_opt")} --</SelectItem>
                      {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">{t("crud_pages.races.race_type")}</Label>
                  <Input value={editForm.type || ""} onChange={e => setEditForm({...editForm, type: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">{t("crud_pages.races.club_name")}</Label>
                  <Input value={editForm.clubName || ""} onChange={e => setEditForm({...editForm, clubName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">{t("crud_pages.races.club_number")}</Label>
                  <Input value={editForm.clubNumber || ""} onChange={e => setEditForm({...editForm, clubNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">{t("crud_pages.races.combine_name")}</Label>
                  <Input value={editForm.combineName || ""} onChange={e => setEditForm({...editForm, combineName: e.target.value})} />
                </div>
              </div>
            </div>

            <Separator />
            <div className="space-y-2">
              <Label className="text-xs font-bold">{t("crud_pages.races.general_notes")}</Label>
              <Textarea value={editForm.notes || ""} onChange={e => setEditForm({...editForm, notes: e.target.value})} />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSaveEdit} className="px-8 font-bold">{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Team Dialog */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("crud_pages.races.add_team")}</DialogTitle>
            <DialogDescription>{t("crud_pages.races.select_team_desc")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">{t("crud_pages.races.field_team")}</Label>
            <Select 
              value={race.teamId || "none"} 
              onValueChange={async (val) => {
                await saveAndSync(db.races, "race", { ...race, teamId: val === "none" ? "" : val }, false);
                setTeamDialogOpen(false);
                toast.success(t("pigeon_edit.save_updated"));
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("crud_pages.races.no_team_opt")}</SelectItem>
                {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Remove Individual Pigeons Dialog */}
      <Dialog open={pigeonsDialogOpen} onOpenChange={setPigeonsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("crud_pages.races.add_remove_pigeons")}</DialogTitle>
            <DialogDescription>{t("crud_pages.races.manual_selection_desc")}</DialogDescription>
          </DialogHeader>
          
          <div className="relative my-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t("crud_pages.races.search_placeholder")} 
              className="pl-9"
              value={pigeonSearch}
              onChange={e => setPigeonSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {allPigeons
              .filter(p => 
                p.ringNumber.toLowerCase().includes(pigeonSearch.toLowerCase()) || 
                p.name.toLowerCase().includes(pigeonSearch.toLowerCase())
              )
              .map(p => {
                const isSelected = (race.pigeonIds || []).includes(p.id);
                const isInTeam = raceTeam?.pigeonIds?.includes(p.id);

                return (
                  <div 
                    key={p.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isSelected || isInTeam ? "bg-primary/5 border-primary/30" : "hover:bg-muted"
                    }`}
                  >
                    <div>
                      <p className="font-bold">{p.ringNumber}</p>
                      <p className="text-xs text-muted-foreground">{p.name}</p>
                      {isInTeam && <p className="text-[10px] text-primary font-bold uppercase mt-1">{t("crud_pages.races.in_team_badge")}</p>}
                    </div>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      disabled={isInTeam}
                      onClick={() => togglePigeonInRace(p.id)}
                    >
                      {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                );
              })}
          </div>
          
          <DialogFooter className="mt-4">
            <Button onClick={() => setPigeonsDialogOpen(false)}>{t("crud_pages.races.done")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
