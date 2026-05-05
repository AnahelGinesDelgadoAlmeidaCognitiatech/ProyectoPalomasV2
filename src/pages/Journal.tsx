import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CrudPage } from "@/components/CrudPage";
import { db, type JournalEntry } from "@/lib/db";

export default function Journal() {
  const { t } = useTranslation();
  return (
    <CrudPage<JournalEntry>
      title={t("sidebar.journal")}
      description={t("crud_pages.journal.desc")}
      icon={BookOpen}
      table={db.journal}
      entity="journal"
      defaults={() => ({ date: new Date().toISOString().slice(0, 10), title: "", body: "" })}
      fields={[
        { name: "date", label: t("crud_pages.journal.field_date"), type: "date", required: true },
        { name: "title", label: t("crud_pages.journal.field_title"), required: true },
        { name: "body", label: t("crud_pages.journal.field_body"), type: "textarea", full: true },
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
