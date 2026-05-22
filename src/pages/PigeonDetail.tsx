import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MessageSquarePlus, Pill, Trophy, Plus, Pencil, Trash2, Bird, Images as ImagesIcon, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PedigreeTree } from "@/components/PedigreeTree";
import { ImageUpload } from "@/components/ImageUpload";
import { db, enqueueSync, uid, type Race, type Medication, type Comment } from "@/lib/db";
import { calculateCOI } from "@/lib/genetics";
import { toast } from "sonner";

export default function PigeonDetail() {
  const { id } = useParams();
  const pigeonId = id;
  const pigeon = useLiveQuery(() => (pigeonId ? db.pigeons.get(pigeonId) : undefined), [pigeonId]);
  const allPigeons = useLiveQuery(() => db.pigeons.toArray(), []) ?? [];
  const allLofts = useLiveQuery(() => db.lofts.toArray(), []) ?? [];
  const { t } = useTranslation();

  const [medOpen, setMedOpen] = useState(false);
  const [medEditingId, setMedEditingId] = useState<string | null>(null);
  const [medForm, setMedForm] = useState({ name: "", dose: "", reason: "", date: new Date().toISOString().split("T")[0] });

  const [commentOpen, setCommentOpen] = useState(false);
  const [commentEditingId, setCommentEditingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const [raceOpen, setRaceOpen] = useState(false);
  const [raceEditingId, setRaceEditingId] = useState<string | null>(null);
  const [raceForm, setRaceForm] = useState({ name: "", date: new Date().toISOString().split("T")[0], distance: "" });

  const [sectionOpen, setSectionOpen] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState<any>({});

  const races = useLiveQuery(async () => {
    if (!pigeonId) return [];
    const all = await db.races.toArray();
    return all.filter(r => r.pigeonIds?.includes(pigeonId) || r.results?.some(res => res.pigeonId === pigeonId));
  }, [pigeonId]) ?? [];

  const medications = useLiveQuery(async () => {
    if (!pigeonId) return [];
    const all = await db.medications.toArray();
    return all.filter(m => !m.pigeonIds?.length || m.pigeonIds.includes(pigeonId));
  }, [pigeonId]) ?? [];

  const comments = useLiveQuery(async () => {
    if (!pigeonId) return [];
    const all = await db.comments.toArray();
    return all.filter(c => c.target === "pigeon" && c.targetId === pigeonId);
  }, [pigeonId]) ?? [];

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
  
  const loftName = allLofts.find(l => l.id === pigeon.loft)?.name || pigeon.loft || "—";

  async function saveMedication() {
    if (!medForm.name.trim() || !pigeon?.id) return;
    if (medEditingId) {
      const m = await db.medications.get(medEditingId);
      if (m) {
        const updated = { ...m, ...medForm, updatedAt: Date.now() };
        await db.medications.put(updated);
        await enqueueSync({ entity: "medication", op: "update", payload: updated });
        toast.success(t("crud.saved"));
      }
    } else {
      const m: Medication = {
        id: uid(),
        ...medForm,
        pigeonIds: [pigeon.id],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.medications.put(m);
      await enqueueSync({ entity: "medication", op: "create", payload: m });
      toast.success(t("pigeon_detail.medication_added", "Medicamento añadido"));
    }
    setMedOpen(false);
  }

  async function saveComment() {
    if (!commentText.trim() || !pigeon?.id) return;
    if (commentEditingId) {
      const c = await db.comments.get(commentEditingId);
      if (c) {
        const updated = { ...c, text: commentText, updatedAt: Date.now() };
        await db.comments.put(updated);
        await enqueueSync({ entity: "comment", op: "update", payload: updated });
        toast.success(t("crud.saved"));
      }
    } else {
      const c: Comment = {
        id: uid(),
        target: "pigeon",
        targetId: pigeon.id,
        author: "Owner",
        text: commentText,
        date: new Date().toISOString().split("T")[0],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.comments.put(c);
      await enqueueSync({ entity: "comment", op: "create", payload: c });
      toast.success(t("pigeon_detail.comment_added", "Comentario añadido"));
    }
    setCommentOpen(false);
  }

  async function saveRace() {
    if (!raceForm.name.trim() || !pigeon?.id) return;
    if (raceEditingId) {
      const r = await db.races.get(raceEditingId);
      if (r) {
        const updated = { ...r, name: raceForm.name, date: raceForm.date, distanceKm: Number(raceForm.distance) || 0, updatedAt: Date.now() };
        await db.races.put(updated);
        await enqueueSync({ entity: "race", op: "update", payload: updated });
        toast.success(t("crud.saved"));
      }
    } else {
      const r: Race = {
        id: uid(),
        name: raceForm.name,
        date: raceForm.date,
        distanceKm: Number(raceForm.distance) || 0,
        pigeonIds: [pigeon.id],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.races.put(r);
      await enqueueSync({ entity: "race", op: "create", payload: r });
      toast.success(t("pigeon_detail.race_created", "Vuelo registrado"));
    }
    setRaceOpen(false);
  }

  async function saveSection() {
    if (!pigeon?.id) return;
    const updated = { ...pigeon, ...sectionForm, updatedAt: Date.now() };
    await db.pigeons.put(updated);
    await enqueueSync({ entity: "pigeon", op: "update", payload: updated });
    toast.success(t("crud.saved"));
    setSectionOpen(null);
  }

  function openSection(section: string) {
    setSectionForm({ ...pigeon });
    setSectionOpen(section);
  }

  async function removeMedication(id: string) {
    if (!confirm(t("crud.delete_confirm"))) return;
    await db.medications.delete(id);
    await enqueueSync({ entity: "medication", op: "delete", payload: { id } });
    toast.success(t("crud.deleted"));
  }

  async function removeComment(id: string) {
    if (!confirm(t("crud.delete_confirm"))) return;
    await db.comments.delete(id);
    await enqueueSync({ entity: "comment", op: "delete", payload: { id } });
    toast.success(t("crud.deleted"));
  }

  async function removeRace(id: string) {
    if (!confirm(t("crud.delete_confirm"))) return;
    await db.races.delete(id);
    await enqueueSync({ entity: "race", op: "delete", payload: { id } });
    toast.success(t("crud.deleted"));
  }

  const MAX_GALLERY = 4;
  const gallery = pigeon.images ?? [];

  async function addGalleryImage(url: string) {
    if (!pigeon?.id) return;
    const next = [...(pigeon.images ?? []), url].slice(0, MAX_GALLERY);
    const updated = { ...pigeon, images: next, updatedAt: Date.now() };
    await db.pigeons.put(updated);
    await enqueueSync({ entity: "pigeon", op: "update", payload: updated });
    toast.success(t("pigeon_detail.photo_added"));
  }

  async function removeGalleryImage(index: number) {
    if (!pigeon?.id) return;
    if (!confirm(t("crud.delete_confirm"))) return;
    const next = (pigeon.images ?? []).filter((_, i) => i !== index);
    const updated = { ...pigeon, images: next, updatedAt: Date.now() };
    await db.pigeons.put(updated);
    await enqueueSync({ entity: "pigeon", op: "update", payload: updated });
    toast.success(t("crud.deleted"));
  }

  async function replaceGalleryImage(index: number, url: string) {
    if (!pigeon?.id) return;
    const next = [...(pigeon.images ?? [])];
    next[index] = url;
    const updated = { ...pigeon, images: next, updatedAt: Date.now() };
    await db.pigeons.put(updated);
    await enqueueSync({ entity: "pigeon", op: "update", payload: updated });
    toast.success(t("crud.saved"));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
          <Link to="/pigeons"><ArrowLeft className="h-4 w-4" /> {t("pigeon_detail.back")}</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="gap-1.5 shadow-elegant">
            <Link to={`/pigeons/${pigeon.id}/edit`}><Pencil className="h-3.5 w-3.5" /> {t("pigeon_detail.edit")}</Link>
          </Button>
          <Button size="sm" variant="outline" className="hidden sm:flex" disabled>{t("pigeon_detail.pdf")}</Button>
        </div>
      </div>

      {/* Header card */}
      <Card className="overflow-hidden shadow-card border-none">
        <div className="grid gap-0 md:grid-cols-[280px_1fr]">
          <div className="aspect-[4/3] md:aspect-auto overflow-hidden bg-secondary">
            {pigeon.image ? (
              <img src={pigeon.image} alt={pigeon.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
                <Bird className="h-10 w-10 opacity-20" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-6 p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-mono text-xs uppercase text-muted-foreground tracking-wider">{pigeon.bornYear} · {pigeon.ringNumber} · {pigeon.sex.toUpperCase()}</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{pigeon.name || "—"}</h1>
                <p className="text-sm text-muted-foreground">{pigeon.color} · {loftName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="border-0 capitalize bg-primary/10 text-primary px-3 py-1">{t(`status.${pigeon.status}`)}</Badge>
                <Badge variant="secondary" className="border-0 bg-accent/10 text-accent px-3 py-1">{Math.min(rating, 100)}/100</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={t("pigeon_detail.wins")} value={String(pigeon.wins ?? 0)} />
              <Stat label={t("pigeon_detail.races")} value={String(pigeon.races ?? 0)} />
              <Stat label={t("pigeon_detail.children")} value={String(children.length)} />
              <Stat label={t("pigeon_detail.inbreeding")} value={`${inbreeding}%`} />
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50 sm:flex-wrap">
          <TabsTrigger value="overview" className="flex-none sm:flex-1">{t("pigeon_detail.tab_overview")}</TabsTrigger>
          <TabsTrigger value="photos" className="flex-none sm:flex-1 gap-1.5"><ImagesIcon className="h-3.5 w-3.5" />{t("pigeon_detail.tab_photos")}</TabsTrigger>
          <TabsTrigger value="pedigree" className="flex-none sm:flex-1">{t("pigeon_detail.tab_pedigree")}</TabsTrigger>
          <TabsTrigger value="races" className="flex-none sm:flex-1">{t("pigeon_detail.tab_race_history")}</TabsTrigger>
          <TabsTrigger value="medications" className="flex-none sm:flex-1">{t("pigeon_detail.tab_medications")}</TabsTrigger>
          <TabsTrigger value="comments" className="flex-none sm:flex-1">{t("pigeon_detail.tab_comments")}</TabsTrigger>
          <TabsTrigger value="related" className="flex-none sm:flex-1">{t("pigeon_detail.tab_related")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 grid gap-6 lg:grid-cols-2">
          <InfoCard title={t("pigeon_detail.basic_info")} onEdit={() => openSection("basic")} rows={[
            [t("pigeon_detail.name"), pigeon.name],
            [t("pigeon_detail.dob"), `${pigeon.bornYear ?? "—"}`],
            [t("pigeon_detail.sex"), pigeon.sex === "cock" ? t("pigeon_detail.cock") : t("pigeon_detail.hen")],
            [t("pigeon_detail.id_band"), pigeon.ringNumber],
            [t("pigeon_detail.trail_band"), pigeon.trailBand ?? "—"],
          ]} />
          <InfoCard title={t("pigeon_detail.meta_info")} onEdit={() => openSection("meta")} rows={[
            [t("pigeon_edit.field_status"), pigeon.status],
            [t("pigeon_detail.location"), loftName],
            [t("pigeon_detail.family"), pigeon.family ?? "—"],
            [t("pigeon_detail.last_owner"), pigeon.lastOwner ?? "—"],
            [t("pigeon_detail.rating"), `${Math.min(rating, 100)}/100`],
            [t("pigeon_detail.tags"), pigeon.tags ?? "—"],
          ]} />
          <InfoCard title={t("pigeon_detail.color_info")} onEdit={() => openSection("color")} rows={[
            [t("autocomplete.cat_color"), pigeon.color],
            [t("pigeon_detail.eye"), pigeon.eyeColor ?? "—"],
            [t("pigeon_detail.leg"), pigeon.legColor ?? "—"],
            [t("pigeon_detail.markings"), pigeon.markings ?? "—"],
          ]} />
          <InfoCard title={t("pigeon_detail.genetics")} onEdit={() => openSection("genetics")} rows={[
            [t("pigeon_detail.base_color"), pigeon.baseColor ?? "—"],
            [t("pigeon_detail.carried_color"), pigeon.carriedColor ?? "—"],
            [t("pigeon_detail.patterns"), pigeon.patterns ?? "—"],
            [t("pigeon_detail.carried_patterns"), pigeon.carriedPatterns ?? "—"],
            [t("pigeon_detail.spread"), pigeon.spread ?? "—"],
            [t("pigeon_detail.dilute"), pigeon.dilute ?? "—"],
            [t("pigeon_detail.grizzle"), pigeon.grizzle ?? "—"],
            [t("pigeon_detail.recessive_red"), pigeon.recessiveRed ?? "—"],
          ]} />

          {/* Section Edit Dialog */}
          <Dialog open={!!sectionOpen} onOpenChange={(v) => !v && setSectionOpen(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {sectionOpen === "basic" && t("pigeon_detail.basic_info")}
                  {sectionOpen === "meta" && t("pigeon_detail.meta_info")}
                  {sectionOpen === "color" && t("pigeon_detail.color_info")}
                  {sectionOpen === "genetics" && t("pigeon_detail.genetics")}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                {sectionOpen === "basic" && (
                  <>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.name")}</Label>
                      <Input value={sectionForm.name || ""} onChange={e => setSectionForm({...sectionForm, name: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.dob")}</Label>
                      <Input type="number" value={sectionForm.bornYear || ""} onChange={e => setSectionForm({...sectionForm, bornYear: Number(e.target.value) || undefined})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.sex")}</Label>
                      <Select value={sectionForm.sex} onValueChange={v => setSectionForm({...sectionForm, sex: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cock">{t("pigeon_detail.cock")}</SelectItem>
                          <SelectItem value="hen">{t("pigeon_detail.hen")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.id_band")}</Label>
                      <Input value={sectionForm.ringNumber || ""} onChange={e => setSectionForm({...sectionForm, ringNumber: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.trail_band")}</Label>
                      <Input value={sectionForm.trailBand || ""} onChange={e => setSectionForm({...sectionForm, trailBand: e.target.value})} />
                    </div>
                  </>
                )}
                {sectionOpen === "meta" && (
                  <>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_edit.field_status")}</Label>
                      <Select value={sectionForm.status} onValueChange={v => setSectionForm({...sectionForm, status: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breeder">{t("status.breeder")}</SelectItem>
                          <SelectItem value="racer">{t("status.racer")}</SelectItem>
                          <SelectItem value="young">{t("status.young")}</SelectItem>
                          <SelectItem value="lost">{t("status.lost")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.location")}</Label>
                      <Input value={sectionForm.loft || ""} onChange={e => setSectionForm({...sectionForm, loft: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.family")}</Label>
                      <Input value={sectionForm.family || ""} onChange={e => setSectionForm({...sectionForm, family: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.last_owner")}</Label>
                      <Input value={sectionForm.lastOwner || ""} onChange={e => setSectionForm({...sectionForm, lastOwner: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.tags")}</Label>
                      <Input value={sectionForm.tags || ""} onChange={e => setSectionForm({...sectionForm, tags: e.target.value})} />
                    </div>
                  </>
                )}
                {sectionOpen === "color" && (
                  <>
                    <div className="grid gap-2">
                      <Label>{t("autocomplete.cat_color")}</Label>
                      <Input value={sectionForm.color || ""} onChange={e => setSectionForm({...sectionForm, color: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.eye")}</Label>
                      <Input value={sectionForm.eyeColor || ""} onChange={e => setSectionForm({...sectionForm, eyeColor: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.leg")}</Label>
                      <Input value={sectionForm.legColor || ""} onChange={e => setSectionForm({...sectionForm, legColor: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.markings")}</Label>
                      <Input value={sectionForm.markings || ""} onChange={e => setSectionForm({...sectionForm, markings: e.target.value})} />
                    </div>
                  </>
                )}
                {sectionOpen === "genetics" && (
                  <>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.base_color")}</Label>
                      <Input value={sectionForm.baseColor || ""} onChange={e => setSectionForm({...sectionForm, baseColor: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.carried_color")}</Label>
                      <Input value={sectionForm.carriedColor || ""} onChange={e => setSectionForm({...sectionForm, carriedColor: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.patterns")}</Label>
                      <Input value={sectionForm.patterns || ""} onChange={e => setSectionForm({...sectionForm, patterns: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.carried_patterns")}</Label>
                      <Input value={sectionForm.carriedPatterns || ""} onChange={e => setSectionForm({...sectionForm, carriedPatterns: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.spread")}</Label>
                      <Input value={sectionForm.spread || ""} onChange={e => setSectionForm({...sectionForm, spread: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.dilute")}</Label>
                      <Input value={sectionForm.dilute || ""} onChange={e => setSectionForm({...sectionForm, dilute: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.grizzle")}</Label>
                      <Input value={sectionForm.grizzle || ""} onChange={e => setSectionForm({...sectionForm, grizzle: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("pigeon_detail.recessive_red")}</Label>
                      <Input value={sectionForm.recessiveRed || ""} onChange={e => setSectionForm({...sectionForm, recessiveRed: e.target.value})} />
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSectionOpen(null)}>{t("crud.cancel")}</Button>
                <Button onClick={saveSection}>{t("crud.save")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

        <TabsContent value="photos" className="mt-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImagesIcon className="h-4 w-4 text-primary" />
                {t("pigeon_detail.tab_photos")}
                <Badge variant="outline" className="ml-2 text-[10px]">{gallery.length}/{MAX_GALLERY}</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("pigeon_detail.photos_desc")}
              </p>
            </CardHeader>
            <CardContent>
              <PhotoGallery
                images={gallery}
                max={MAX_GALLERY}
                onAdd={addGalleryImage}
                onReplace={replaceGalleryImage}
                onRemove={removeGalleryImage}
              />
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
              <Dialog open={raceOpen} onOpenChange={(v) => {
                setRaceOpen(v);
                if(!v) { setRaceEditingId(null); setRaceForm({ name: "", date: new Date().toISOString().split("T")[0], distance: "" }); }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => {
                    setRaceEditingId(null);
                    setRaceForm({ name: "", date: new Date().toISOString().split("T")[0], distance: "" });
                  }}>{t("pigeon_detail.create_race")}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{t("pigeon_detail.create_race")}</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Nombre de la carrera</Label>
                      <Input value={raceForm.name} onChange={e => setRaceForm({...raceForm, name: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Fecha</Label>
                      <Input type="date" value={raceForm.date} onChange={e => setRaceForm({...raceForm, date: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Distancia (Km)</Label>
                      <Input type="number" value={raceForm.distance} onChange={e => setRaceForm({...raceForm, distance: e.target.value})} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRaceOpen(false)}>{t("crud.cancel")}</Button>
                    <Button onClick={saveRace}>{t("crud.save")}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {races.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("pigeon_detail.none_recorded")}</p>
                ) : (
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
                      <th className="py-2 pr-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {races.map((r) => {
                      const res = r.results?.find(x => x.pigeonId === pigeon?.id);
                      return (
                      <tr key={r.id} className="border-b border-border/60">
                        <td className="py-3 pr-3 font-medium">{r.name}</td>
                        <td className="py-3 pr-3 text-muted-foreground">{r.date}</td>
                        <td className="py-3 pr-3">{r.distanceKm ? `${r.distanceKm} km` : "—"}</td>
                        <td className="py-3 pr-3">{r.totalBirds?.toLocaleString() ?? "—"}</td>
                        <td className="py-3 pr-3">{res?.arrivalTime ?? "—"}</td>
                        <td className="py-3 pr-3">
                          {res?.position ? <Badge variant="secondary" className="bg-accent/10 text-accent border-0">{res.position}</Badge> : "—"}
                        </td>
                        <td className="py-3 pr-3">{res?.speed ? `${res.speed} m/min` : "—"}</td>
                        <td className="py-3 pr-3 flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                            setRaceEditingId(r.id);
                            setRaceForm({ name: r.name, date: r.date, distance: String(r.distanceKm || "") });
                            setRaceOpen(true);
                          }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeRace(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications" className="mt-6">
          <Card className="shadow-soft">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Pill className="h-5 w-5 text-primary" /> {t("pigeon_detail.tab_medications")}</CardTitle>
              <Dialog open={medOpen} onOpenChange={(v) => {
                setMedOpen(v);
                if(!v) { setMedEditingId(null); setMedForm({ name: "", dose: "", reason: "", date: new Date().toISOString().split("T")[0] }); }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => {
                    setMedEditingId(null);
                    setMedForm({ name: "", dose: "", reason: "", date: new Date().toISOString().split("T")[0] });
                  }}>{t("pigeon_detail.add_medication")}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{t("pigeon_detail.add_medication")}</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Nombre del medicamento</Label>
                      <Input value={medForm.name} onChange={e => setMedForm({...medForm, name: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Dosis</Label>
                      <Input placeholder="Ej. 1 gota/pico" value={medForm.dose} onChange={e => setMedForm({...medForm, dose: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Motivo / Descripción</Label>
                      <Input placeholder="Ej. Prevención, Tratamiento..." value={medForm.reason} onChange={e => setMedForm({...medForm, reason: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Fecha</Label>
                      <Input type="date" value={medForm.date} onChange={e => setMedForm({...medForm, date: e.target.value})} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setMedOpen(false)}>{t("crud.cancel")}</Button>
                    <Button onClick={saveMedication}>{t("crud.save")}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2">
              {medications.length === 0 && <p className="text-sm text-muted-foreground">{t("pigeon_detail.none_recorded")}</p>}
              {medications.map((m) => (
                <div key={m.id} className="flex items-start justify-between rounded-lg border border-border bg-card p-3">
                  <div>
                    <p className="font-medium">{m.name} {!m.pigeonIds?.length && <Badge variant="outline" className="ml-2 text-[10px]">Loft</Badge>}</p>
                    <p className="text-xs text-muted-foreground">{m.date} {m.reason ? `· ${m.reason}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{m.dose}</span>
                    <div className="flex items-center">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                        setMedEditingId(m.id);
                        setMedForm({ name: m.name, dose: m.dose || "", reason: m.reason || "", date: m.date });
                        setMedOpen(true);
                      }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeMedication(m.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <Card className="shadow-soft">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><MessageSquarePlus className="h-5 w-5 text-primary" /> {t("pigeon_detail.tab_comments")}</CardTitle>
              <Dialog open={commentOpen} onOpenChange={(v) => {
                setCommentOpen(v);
                if(!v) { setCommentEditingId(null); setCommentText(""); }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => {
                    setCommentEditingId(null);
                    setCommentText("");
                  }}>{t("pigeon_detail.add_comment")}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{t("pigeon_detail.add_comment")}</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Textarea placeholder="Escribe tu comentario aquí..." value={commentText} onChange={e => setCommentText(e.target.value)} className="min-h-32" />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCommentOpen(false)}>{t("crud.cancel")}</Button>
                    <Button onClick={saveComment}>{t("crud.save")}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-3">
              {comments.length === 0 && <p className="text-sm text-muted-foreground">{t("pigeon_detail.none_recorded")}</p>}
              {comments.map((c) => (
                <div key={c.id} className="flex items-start justify-between rounded-lg border border-border bg-card p-3">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm whitespace-pre-wrap">{c.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{c.author} · {c.date}</p>
                  </div>
                  <div className="flex items-center shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                      setCommentEditingId(c.id);
                      setCommentText(c.text);
                      setCommentOpen(true);
                    }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeComment(c.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
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

function InfoCard({ title, rows, onEdit }: { title: string; rows: [string, string][]; onEdit?: () => void }) {
  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-col justify-between gap-2 pb-2 sm:flex-row sm:items-center sm:space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        {onEdit && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <dl className="divide-y divide-border">
          {rows.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1 py-2.5 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:py-2">
              <dt className="text-muted-foreground shrink-0 sm:min-w-[100px]">{k}</dt>
              <dd className="font-medium break-words capitalize text-left sm:text-right">{v || "—"}</dd>
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

function PhotoGallery({
  images,
  max,
  onAdd,
  onReplace,
  onRemove,
}: {
  images: string[];
  max: number;
  onAdd: (url: string) => void;
  onReplace: (index: number, url: string) => void;
  onRemove: (index: number) => void;
}) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const canAddMore = images.length < max;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((url, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border bg-secondary">
            <button
              type="button"
              onClick={() => setPreview(url)}
              className="absolute inset-0 h-full w-full"
              aria-label={t("pigeon_detail.view_photo")}
            >
              <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
            </button>
            <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-7 w-7 shadow"
                onClick={(e) => { e.stopPropagation(); setEditingIndex(i); }}
                aria-label={t("crud.aria_edit")}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-7 w-7 shadow"
                onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                aria-label={t("crud.aria_delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="aspect-square flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs font-medium">{t("pigeon_detail.add_photo")}</span>
          </button>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="max-w-3xl p-2">
          {preview && (
            <img src={preview} alt="Preview" className="w-full h-auto rounded-md object-contain max-h-[80vh]" />
          )}
        </DialogContent>
      </Dialog>

      {/* Add dialog */}
      <Dialog open={adding} onOpenChange={(v) => setAdding(v)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("pigeon_detail.add_photo")}</DialogTitle>
          </DialogHeader>
          <ImageUpload
            onUpload={(url) => { onAdd(url); setAdding(false); }}
            onRemove={() => {}}
          />
        </DialogContent>
      </Dialog>

      {/* Replace dialog */}
      <Dialog open={editingIndex !== null} onOpenChange={(v) => !v && setEditingIndex(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("pigeon_detail.replace_photo")}</DialogTitle>
          </DialogHeader>
          {editingIndex !== null && (
            <ImageUpload
              currentImage={images[editingIndex]}
              onUpload={(url) => { onReplace(editingIndex, url); setEditingIndex(null); }}
              onRemove={() => { onRemove(editingIndex); setEditingIndex(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
