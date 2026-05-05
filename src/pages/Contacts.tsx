import { Contact2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CrudPage } from "@/components/CrudPage";
import { db, type Contact } from "@/lib/db";

export default function Contacts() {
  const { t } = useTranslation();
  return (
    <CrudPage<Contact>
      title={t("sidebar.contacts")}
      description={t("crud_pages.contacts.desc")}
      icon={Contact2}
      table={db.contacts}
      entity="contact"
      defaults={() => ({ name: "" })}
      fields={[
        { name: "name", label: t("crud_pages.contacts.field_name"), required: true },
        { name: "country", label: t("crud_pages.contacts.field_country"), placeholder: t("crud_pages.contacts.placeholder_country") },
        { name: "email", label: t("crud_pages.contacts.field_email") },
        { name: "phone", label: t("crud_pages.contacts.field_phone") },
        { name: "loft", label: t("crud_pages.contacts.field_loft") },
        { name: "notes", label: t("crud_pages.contacts.field_notes"), type: "textarea", full: true },
      ]}
      renderItem={(c) => (
        <div>
          <p className="font-semibold">{c.name} {c.country && <span className="text-muted-foreground font-normal">· {c.country}</span>}</p>
          <p className="text-xs text-muted-foreground">{[c.email, c.phone, c.loft].filter(Boolean).join(" · ") || "—"}</p>
        </div>
      )}
    />
  );
}
