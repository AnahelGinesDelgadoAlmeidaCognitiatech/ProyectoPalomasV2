import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CrudPage } from "@/components/CrudPage";
import { db, type Pair } from "@/lib/db";

export default function Pairs() {
  const { t } = useTranslation();
  return (
    <CrudPage<Pair>
      title={t("sidebar.pairs")}
      description={t("crud_pages.pairs.desc")}
      icon={Heart}
      table={db.pairs}
      entity="pair"
      defaults={() => ({ season: String(new Date().getFullYear()), pigeonIds: [] as any })}
      fields={[
        { name: "season", label: t("crud_pages.pairs.field_season"), required: true, placeholder: "2025" },
        { name: "nestBox", label: t("crud_pages.pairs.field_nestbox"), placeholder: "A-12" },
        { name: "cockId", label: t("crud_pages.pairs.field_cock"), placeholder: "p-101" },
        { name: "henId", label: t("crud_pages.pairs.field_hen"), placeholder: "p-102" },
        { name: "notes", label: t("crud_pages.pairs.field_notes"), type: "textarea", full: true },
      ]}
      renderItem={(p) => (
        <div>
          <p className="font-semibold">{t("crud_pages.pairs.season_prefix")} {p.season} {p.nestBox && <span className="text-muted-foreground font-normal">· {t("crud_pages.pairs.nest_prefix")} {p.nestBox}</span>}</p>
          <p className="text-xs text-muted-foreground">♂ {p.cockId || "—"} × ♀ {p.henId || "—"}</p>
          {p.notes && <p className="text-xs mt-1">{p.notes}</p>}
        </div>
      )}
    />
  );
}
