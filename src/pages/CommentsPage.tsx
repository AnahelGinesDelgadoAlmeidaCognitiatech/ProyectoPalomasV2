import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { db, enqueueSync, removeAndSync, uid, type Comment, type CommentTarget } from "@/lib/db";

export default function CommentsPage({ target, title }: { target: CommentTarget; title: string }) {
  const { t } = useTranslation();
  const items = useLiveQuery(
    () => db.comments.where("target").equals(target).reverse().sortBy("date"),
    [target]
  ) ?? [];

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Comment | null>(null);

  function newOne() {
    const now = Date.now();
    setDraft({
      id: uid(), target, targetId: "", author: "", text: "",
      date: new Date().toISOString().slice(0, 10), createdAt: now, updatedAt: now,
    });
    setOpen(true);
  }
  async function save() {
    if (!draft) return;
    if (!draft.text.trim()) { toast.error(t("comments.err_empty")); return; }
    await db.comments.put({ ...draft, updatedAt: Date.now() });
    await enqueueSync({ entity: "comment", op: "create", payload: draft });
    toast.success(t("comments.added"));
    setOpen(false); setDraft(null);
  }
  async function remove(id: string) {
    if (!confirm(t("comments.delete_confirm"))) return;
    await removeAndSync(db.comments, "comment", id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">
              {target === "pigeon" ? t("comments.desc_pigeons") : target === "pair" ? t("comments.desc_pairs") : t("comments.desc_teams")}
            </p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={newOne} className="gap-2"><Plus className="h-4 w-4" /> {t("comments.new")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("comments.new_title")}</DialogTitle></DialogHeader>
            {draft && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase">{t("comments.target_id")}</Label>
                    <Input value={draft.targetId} onChange={(e) => setDraft({ ...draft, targetId: e.target.value })} placeholder="p-201" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase">{t("comments.author")}</Label>
                    <Input value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase">{t("comments.date")}</Label>
                    <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase">{t("comments.text")}</Label>
                  <Textarea value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} className="min-h-28" />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t("comments.cancel")}</Button>
              <Button onClick={save}>{t("comments.save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{t("comments.empty")}</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {items.map((c) => (
            <Card key={c.id} className="shadow-soft">
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{c.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.author || "—"} · {c.date} {c.targetId && `· ${c.targetId}`}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(c.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
