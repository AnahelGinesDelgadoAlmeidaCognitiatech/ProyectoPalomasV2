import { Contact2 } from "lucide-react";
import { CrudPage } from "@/components/CrudPage";
import { db, type Contact } from "@/lib/db";

export default function Contacts() {
  return (
    <CrudPage<Contact>
      title="Contacts"
      description="Tu agenda de aficionados y clubes."
      icon={Contact2}
      table={db.contacts}
      entity="contact"
      defaults={() => ({ name: "" })}
      fields={[
        { name: "name", label: "Nombre", required: true },
        { name: "country", label: "País", placeholder: "España" },
        { name: "email", label: "Email" },
        { name: "phone", label: "Teléfono" },
        { name: "loft", label: "Palomar" },
        { name: "notes", label: "Notas", type: "textarea", full: true },
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
