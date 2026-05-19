import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, Database, UserCheck } from "lucide-react";
import { toast } from "sonner";

const DebugDB = () => {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // New state for form
  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("admin1234");

  React.useEffect(() => {
    checkSession();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
      setSession(data.session);
      toast.success("Logueado correctamente");
    } catch (err: any) {
      setError(err.message);
      toast.error("Error al loguear");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) throw signupError;
      toast.success("Registro enviado. Revisa tu email o el dashboard de Supabase.");
    } catch (err: any) {
      setError(err.message);
      toast.error("Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  const testInsert = async () => {
    if (!session) {
      toast.error("Primero debes iniciar sesión");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const testPigeon = {
        ring_number: `DEBUG-${Date.now().toString().slice(-6)}`,
        name: "Paloma de Debug",
        sex: "cock",
        status: "racer",
        notes: "Creada desde la página de debug",
        // El user_id se asigna solo si el RLS lo permite o si lo enviamos
        user_id: session.user.id
      };

      const { data, error: insertError } = await supabase
        .from('pigeons')
        .insert([testPigeon])
        .select();

      if (insertError) throw insertError;
      
      setResult(data);
      toast.success("¡Inserción exitosa!");
    } catch (err: any) {
      setError(err.message);
      toast.error("Error al insertar");
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    toast.info("Sesión cerrada");
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Database className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Supabase Debug Panel</h1>
        </div>
        {session && (
          <Button variant="ghost" onClick={handleLogout} size="sm">
            Cerrar Sesión
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        {/* Step 1: Login/Auth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              1. Autenticación (Supabase Real)
            </CardTitle>
            <CardDescription>
              Usa un email y contraseña registrados en tu proyecto de Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email</label>
              <input 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Contraseña</label>
              <input 
                type="password"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleLogin} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                Iniciar Sesión
              </Button>
              <Button onClick={handleSignUp} variant="outline" disabled={loading} className="flex-1">
                Registrarse
              </Button>
            </div>
            
            {session && (
              <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200">
                Sesión activa para: <strong>{session.user.email}</strong>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Test Manipulation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              2. Prueba de Manipulación (Insert)
            </CardTitle>
            <CardDescription>
              Intentaremos insertar una paloma de prueba en la tabla `pigeons`.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="secondary" 
              onClick={testInsert} 
              disabled={loading || !session}
              className="w-full"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              Insertar Paloma de Prueba
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">¡Conexión Exitosa!</AlertTitle>
            <AlertDescription>
              <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default DebugDB;
