import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CrudPage } from "@/components/CrudPage";
import { db, type Team } from "@/lib/db";

export default function Teams() {
  const { t } = useTranslation();
  return (
    <CrudPage<Team>
      title={t("sidebar.teams")}
      description={t("crud_pages.teams.desc")}
      icon={Users}
      table={db.teams}
      entity="team"
      defaults={() => ({ name: "", pigeonIds: [] })}
      fields={[
        { name: "name", label: t("crud_pages.teams.field_name"), required: true, placeholder: t("crud_pages.teams.placeholder_name") },
        { name: "notes", label: t("crud_pages.teams.field_notes"), type: "textarea", full: true },
      ]}
      renderItem={(tm) => (
        <div>
          <p className="font-semibold">{tm.name}</p>
          <p className="text-xs text-muted-foreground">{tm.pigeonIds?.length ?? 0} {t("crud_pages.teams.pigeons")}</p>
        </div>
      )}
    />
  );
}
