import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const testSession = async () => {
  const result = await supabase.auth.getSession();

  console.log(result);
};

testSession();
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  UserCheck,
  Wifi,
} from "lucide-react";

import { toast } from "sonner";

// ================================
// ENV CUSTOM
// ================================

const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_KEY =
  import.meta.env.SUPABASE_PUBLISHABLE_KEY;

// ================================

const DebugDB = () => {
  const [loading, setLoading] = useState(false);

  const [session, setSession] = useState<any>(null);

  const [result, setResult] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  const [pingStatus, setPingStatus] = useState<
    "idle" | "ok" | "error"
  >("idle");

  const [pingMsg, setPingMsg] = useState("");

  // FORM
  const [email, setEmail] = useState(
    "admin@admin.com"
  );

  const [password, setPassword] = useState(
    "admin1234"
  );

  // ================================
  // SESSION
  // ================================

  React.useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data, error } =
        await supabase.auth.getSession();

      if (error) {
        console.error(error);
        return;
      }

      setSession(data.session);

      console.log(
        "CURRENT SESSION:",
        data.session
      );
    } catch (err) {
      console.error(err);
    }
  };

  // ================================
  // PING
  // ================================

  const handlePing = async () => {
    setPingStatus("idle");

    setPingMsg("");

    setLoading(true);

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/pigeons?select=id&limit=1`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      );

      if (res.ok || res.status === 406) {
        setPingStatus("ok");

        setPingMsg(
          `✅ Conexión OK · HTTP ${res.status} · URL: ${SUPABASE_URL}`
        );

        toast.success(
          "Conexión con Supabase verificada"
        );
      } else {
        const text = await res.text();

        setPingStatus("error");

        setPingMsg(
          `HTTP ${res.status}: ${text}`
        );

        toast.error("Error de conexión");
      }
    } catch (e: any) {
      console.error(e);

      setPingStatus("error");

      setPingMsg(e.message);

      toast.error("Sin conexión con Supabase");
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // LOGIN
  // ================================

  const handleLogin = async () => {
    setLoading(true);

    setError(null);

    try {
      console.log("Intentando login...");

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      console.log(
        "RESPUESTA LOGIN:",
        data
      );

      if (error) {
        console.error(
          "SUPABASE ERROR:",
          error
        );

        throw new Error(
          error.message ||
          "Error al iniciar sesión"
        );
      }

      // VALIDAR SESIÓN
      if (!data?.session) {
        throw new Error(
          "Supabase no devolvió una sesión válida"
        );
      }

      // GUARDAR SESSION
      setSession(data.session);

      toast.success(
        `Sesión iniciada: ${data.user.email}`
      );

      console.log(
        "SESSION OK:",
        data.session
      );
    } catch (err: any) {
      console.error(
        "LOGIN ERROR:",
        err
      );

      setError(
        err.message || "Error desconocido"
      );

      toast.error(
        err.message || "Error al loguear"
      );
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // SIGNUP
  // ================================

  const handleSignUp = async () => {
    setLoading(true);

    setError(null);

    try {
      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

      console.log(
        "SIGNUP RESPONSE:",
        data
      );

      if (error) {
        throw error;
      }

      toast.success(
        "Registro enviado correctamente"
      );
    } catch (err: any) {
      console.error(
        "SIGNUP ERROR:",
        err
      );

      setError(
        err.message || "Error desconocido"
      );

      toast.error(
        err.message || "Error al registrar"
      );
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // INSERT TEST
  // ================================

  const testInsert = async () => {
    if (!session) {
      toast.error(
        "Primero debes iniciar sesión"
      );

      return;
    }

    setLoading(true);

    setResult(null);

    setError(null);

    try {
      const testPigeon = {
        ring_number: `DEBUG-${Date.now()
          .toString()
          .slice(-6)}`,

        name: "Paloma de Debug",

        sex: "cock",

        status: "racer",

        notes:
          "Creada desde la página de debug",

        user_id: session.user.id,
      };

      const { data, error } =
        await supabase
          .from("pigeons")
          .insert([testPigeon])
          .select();

      if (error) {
        throw error;
      }

      setResult(data);

      toast.success(
        "¡Inserción exitosa!"
      );
    } catch (err: any) {
      console.error(
        "INSERT ERROR:",
        err
      );

      setError(
        err.message || "Error desconocido"
      );

      toast.error(
        err.message || "Error al insertar"
      );
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // LOGOUT
  // ================================

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();

      setSession(null);

      toast.info("Sesión cerrada");
    } catch (err) {
      console.error(err);
    }
  };

  // ================================
  // UI
  // ================================

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Database className="w-8 h-8 text-primary" />

          <h1 className="text-3xl font-bold">
            Supabase Debug Panel
          </h1>
        </div>

        {session && (
          <Button
            variant="ghost"
            onClick={handleLogout}
            size="sm"
          >
            Cerrar Sesión
          </Button>
        )}
      </div>

      <div className="grid gap-6">

        {/* ================================ */}
        {/* PING */}
        {/* ================================ */}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />

              0. Ping de Conexión
            </CardTitle>

            <CardDescription>
              Verifica que Supabase responde
              correctamente.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">

            <Button
              onClick={handlePing}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : (
                <Wifi className="mr-2 h-4 w-4" />
              )}

              Probar Conexión
            </Button>

            {pingStatus === "ok" && (
              <div className="p-2 bg-green-50 text-green-700 text-xs rounded border border-green-300 font-mono">
                {pingMsg}
              </div>
            )}

            {pingStatus === "error" && (
              <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-300 font-mono">
                {pingMsg}
              </div>
            )}

          </CardContent>
        </Card>

        {/* ================================ */}
        {/* AUTH */}
        {/* ================================ */}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />

              1. Autenticación
            </CardTitle>

            <CardDescription>
              Usa un usuario real de Supabase.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* EMAIL */}

            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Email
              </label>

              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="admin@example.com"
              />
            </div>

            {/* PASSWORD */}

            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Contraseña
              </label>

              <input
                type="password"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />
            </div>

            {/* BUTTONS */}

            <div className="flex gap-2">

              <Button
                onClick={handleLogin}
                disabled={loading}
                className="flex-1"
              >
                {loading && (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                )}

                Iniciar Sesión
              </Button>

              <Button
                onClick={handleSignUp}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                Registrarse
              </Button>

            </div>

            {/* SESSION */}

            {session && (
              <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200">
                Sesión activa:
                <br />

                <strong>
                  {session.user.email}
                </strong>
              </div>
            )}

          </CardContent>
        </Card>

        {/* ================================ */}
        {/* INSERT */}
        {/* ================================ */}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />

              2. Insert Test
            </CardTitle>

            <CardDescription>
              Insertar una paloma de prueba.
            </CardDescription>
          </CardHeader>

          <CardContent>

            <Button
              variant="secondary"
              onClick={testInsert}
              disabled={loading || !session}
              className="w-full"
            >
              {loading && (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              )}

              Insertar Paloma
            </Button>

          </CardContent>
        </Card>

        {/* ================================ */}
        {/* ERROR */}
        {/* ================================ */}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />

            <AlertTitle>
              Error
            </AlertTitle>

            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* ================================ */}
        {/* RESULT */}
        {/* ================================ */}

        {result && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-500" />

            <AlertTitle className="text-green-700">
              ¡Conexión Exitosa!
            </AlertTitle>

            <AlertDescription>
              <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded border">
                {JSON.stringify(
                  result,
                  null,
                  2
                )}
              </pre>
            </AlertDescription>
          </Alert>
        )}

      </div>
    </div>
  );
};

export default DebugDB;