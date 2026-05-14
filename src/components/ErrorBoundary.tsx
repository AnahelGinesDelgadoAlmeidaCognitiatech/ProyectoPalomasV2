import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-lg rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm">
          <h2 className="text-base font-semibold mb-2">Algo ha fallado</h2>
          <p className="text-muted-foreground mb-3 break-words">
            {this.state.error.message || "Error inesperado"}
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={this.reset}>Reintentar</Button>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              Recargar
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
