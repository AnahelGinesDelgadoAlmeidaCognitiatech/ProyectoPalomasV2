import { useTranslation } from "react-i18next";
import { Construction, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props { title: string; description: string; icon: LucideIcon; features?: string[]; }

export default function ComingSoonPage({ title, description, icon: Icon, features = [] }: Props) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning"><Construction className="h-3.5 w-3.5" /> {t("coming_soon.badge")}</span>
      </div>
      <Card><CardContent className="p-6">
        <p className="text-sm text-muted-foreground mb-3">{t("coming_soon.desc")}</p>
        {features.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />{f}
              </li>
            ))}
          </ul>
        )}
      </CardContent></Card>
    </div>
  );
}
