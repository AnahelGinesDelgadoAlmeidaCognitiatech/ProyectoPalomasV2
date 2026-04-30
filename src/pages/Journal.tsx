import { BookOpen } from "lucide-react";
import { CrudPage } from "@/components/CrudPage";
import { db, type JournalEntry } from "@/lib/db";

export default function Journal() {
  return (
    <CrudPage<JournalEntry>
      title="Daily Journal"
      description="Notas diarias del palomar."
      icon={BookOpen}
      table={db.journal}
      entity="journal"
      defaults={() => ({ date: new Date().toISOString().slice(0, 10), title: "", body: "" })}
      fields={[
        { name: "date", label: "Fecha", type: "date", required: true },
        { name: "title", label: "Título", required: true },
        { name: "body", label: "Contenido", type: "textarea", full: true },
      ]}
      renderItem={(j) => (
        <div>
          <p className="font-semibold">{j.title} <span className="text-muted-foreground font-normal">· {j.date}</span></p>
          {j.body && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{j.body}</p>}
        </div>
      )}
    />
  );
}
