import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">This module is coming soon.</p>
      </div>
      <Card className="shadow-soft">
        <CardContent className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elegant">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="font-medium">{title} module under construction</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tell us what features you want here and we'll build it next.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
