import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { db } from "@/lib/db";
import "@/i18n/config";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  
  // Obtenemos el setting "language" de Dexie
  const dbLanguage = useLiveQuery(
    () => db.settings.get("language"),
    []
  );

  useEffect(() => {
    if (dbLanguage?.value && typeof dbLanguage.value === "string") {
      if (i18n.language !== dbLanguage.value) {
        i18n.changeLanguage(dbLanguage.value);
      }
      try { localStorage.setItem("pigeondb_lang", dbLanguage.value); } catch {}
    }
  }, [dbLanguage?.value, i18n]);

  return <>{children}</>;
}
