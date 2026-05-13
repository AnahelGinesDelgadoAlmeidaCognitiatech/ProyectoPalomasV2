import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction, type LucideIcon } from "lucide-react";

interface ModulePageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features?: string[];
}

export default function ModulePage({ title, description, icon: Icon, features = [] }: ModulePageProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" size="sm" disabled className="gap-2">
          <Construction className="h-4 w-4" /> {t("coming_soon.badge")}
        </Button>
      </div>

      <Card className="overflow-hidden shadow-card">
        <div className="bg-gradient-hero px-6 sm:px-8 py-8 sm:py-12 text-primary-foreground">
          <Icon className="h-10 w-10 opacity-90" />
          <h2 className="mt-4 text-2xl font-bold">{title}</h2>
          <p className="mt-1 max-w-xl text-sm opacity-90">{description}</p>
        </div>
        {features.length > 0 && (
          <CardContent className="p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("coming_soon.planned")}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">{t("coming_soon.tell_us")}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("coming_soon.tell_us_desc")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
