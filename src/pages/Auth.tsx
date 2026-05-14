import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bird, Loader2, Mail, Lock, UserPlus, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // MOCK LOGIN FOR LOCAL TESTING
    if ((email === "admin" && password === "admin1234") || (email === "User1" && password === "User1234")) {
      const mockUser = {
        id: email === "admin" ? "mock-admin-id" : "mock-user1-id",
        email: `${email}@local.test`,
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString()
      };
      localStorage.setItem("pigeondb_mock_user", JSON.stringify(mockUser));
      toast.success(`Modo Local: Bienvenido ${email}`);
      window.location.href = "/"; // Force reload to refresh context
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success(t("auth.login_success") || "Bienvenido de nuevo");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || t("auth.login_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast.success(t("auth.signup_success") || "Registro correcto. Revisa tu email.");
    } catch (error: any) {
      toast.error(error.message || t("auth.signup_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4 relative">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Bird className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground">
            Pigeon<span className="text-primary">DB</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("auth.subtitle") || "Gestión profesional para colombófilos"}
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="gap-2">
              <LogIn className="h-4 w-4" /> {t("auth.tab_login") || "Entrar"}
            </TabsTrigger>
            <TabsTrigger value="signup" className="gap-2">
              <UserPlus className="h-4 w-4" /> {t("auth.tab_signup") || "Registro"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle>{t("auth.login_title") || "Iniciar sesión"}</CardTitle>
                <CardDescription>
                  {t("auth.login_desc") || "Introduce tus credenciales para acceder"}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login">{t("auth.email") || "Email"}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email-login"
                        type="text" 
                        placeholder="tu@email.com" 
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password-login">{t("auth.password") || "Contraseña"}</Label>
                      <Button variant="link" className="h-auto p-0 text-xs text-primary" type="button">
                        {t("auth.forgot_password") || "¿Olvidaste tu contraseña?"}
                      </Button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="password-login"
                        type="password" 
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full gap-2 py-6 text-lg font-bold" type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                    {t("auth.btn_login") || "Entrar"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle>{t("auth.signup_title") || "Crear cuenta"}</CardTitle>
                <CardDescription>
                  {t("auth.signup_desc") || "Empieza a gestionar tu palomar hoy mismo"}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">{t("auth.email") || "Email"}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email-signup"
                        type="email" 
                        placeholder="tu@email.com" 
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">{t("auth.password") || "Contraseña"}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="password-signup"
                        type="password" 
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {t("auth.password_hint") || "Mínimo 6 caracteres"}
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full gap-2 py-6 text-lg font-bold" type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                    {t("auth.btn_signup") || "Registrarse"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground">
          {t("auth.footer") || "Tus datos se guardan de forma segura y privada."}
        </p>
      </div>
    </div>
  );
}
