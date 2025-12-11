"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageSearch, Loader2, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { ROLE_LABELS } from "@/types";

function RegisterContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  
  const [tokenInfo, setTokenInfo] = useState<{ valid: boolean; team?: { name: string }; role?: string; error?: string } | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const { register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setValidating(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/auth/validate-token?token=${token}`);
      const data = await response.json();
      setTokenInfo(data);
    } catch {
      setTokenInfo({ valid: false, error: "Erreur de validation" });
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    const result = await register({
      token,
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
    });

    if (result.success) {
      toast.success("Compte créé avec succès !");
      router.push("/reports");
    } else {
      toast.error(result.error || "Erreur lors de l'inscription");
    }

    setLoading(false);
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/40 dark:from-slate-950 dark:via-emerald-950/20 dark:to-teal-950/30">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold">Token d&apos;invitation requis</h2>
              <p className="text-muted-foreground">
                Pour créer un compte, vous devez utiliser un lien d&apos;invitation fourni par un administrateur.
              </p>
              <Link href="/login">
                <Button variant="outline">Retour à la connexion</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenInfo?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/40 dark:from-slate-950 dark:via-emerald-950/20 dark:to-teal-950/30">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold">Lien invalide</h2>
              <p className="text-muted-foreground">
                {tokenInfo?.error || "Ce lien d'invitation n'est pas valide ou a expiré."}
              </p>
              <Link href="/login">
                <Button variant="outline">Retour à la connexion</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/40 dark:from-slate-950 dark:via-emerald-950/20 dark:to-teal-950/30">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-teal-400/20 to-emerald-400/20 blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
              <PackageSearch className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Créer un compte
          </CardTitle>
          <CardDescription className="text-base">
            Rejoignez l&apos;équipe QuaiTrack
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Token info */}
          <div className="mb-6 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Invitation valide</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              <p>Équipe : <span className="font-medium text-foreground">{tokenInfo.team?.name}</span></p>
              <p>Rôle : <span className="font-medium text-foreground">{ROLE_LABELS[tokenInfo.role as keyof typeof ROLE_LABELS]}</span></p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  placeholder="Jean"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  placeholder="Dupont"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer mon compte"
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}

