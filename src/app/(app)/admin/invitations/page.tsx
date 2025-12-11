"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Trash2, UserPlus, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Team, InvitationToken, ROLE_LABELS } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InvitationWithUrl extends InvitationToken {
  url?: string;
}

export default function InvitationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [invitations, setInvitations] = useState<InvitationWithUrl[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ teamId: "", role: "OPERATOR", expiresInDays: "7" });
  const [saving, setSaving] = useState(false);
  const [newInviteUrl, setNewInviteUrl] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (user && !hasPermission(user.role, "canGenerateInvites")) {
      router.push("/reports");
      return;
    }
    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    try {
      const [invitationsRes, teamsRes] = await Promise.all([
        fetch("/api/invitations"),
        fetch("/api/teams"),
      ]);
      const [invitationsData, teamsData] = await Promise.all([
        invitationsRes.json(),
        teamsRes.json(),
      ]);
      setInvitations(invitationsData);
      setTeams(teamsData);
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: formData.teamId,
          role: formData.role,
          expiresInDays: parseInt(formData.expiresInDays),
        }),
      });

      if (response.ok) {
        const invitation = await response.json();
        setInvitations([invitation, ...invitations]);
        setNewInviteUrl(invitation.url);
        toast.success("Invitation créée");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette invitation ?")) return;

    try {
      const response = await fetch(`/api/invitations/${id}`, { method: "DELETE" });
      if (response.ok) {
        setInvitations(invitations.filter((i) => i.id !== id));
        toast.success("Invitation supprimée");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const copyToClipboard = async (token: string) => {
    const url = `${window.location.origin}/register?token=${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(token);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(null), 2000);
  };

  const openCreate = () => {
    setFormData({ teamId: "", role: "OPERATOR", expiresInDays: "7" });
    setNewInviteUrl("");
    setIsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Liens d&apos;invitation</h1>
          <p className="text-muted-foreground">
            Générez des liens pour inviter de nouveaux utilisateurs
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Générer un lien
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle invitation</DialogTitle>
            </DialogHeader>
            {newInviteUrl ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-muted-foreground mb-2">
                    Partagez ce lien avec la personne à inviter :
                  </p>
                  <div className="flex items-center gap-2">
                    <Input value={newInviteUrl} readOnly className="text-sm" />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(newInviteUrl);
                        toast.success("Lien copié !");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    setNewInviteUrl("");
                    setIsOpen(false);
                  }}
                >
                  Fermer
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Équipe</Label>
                  <Select
                    value={formData.teamId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, teamId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une équipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPERATOR">Opérateur de quai</SelectItem>
                      <SelectItem value="SUPERVISOR">Superviseur</SelectItem>
                      <SelectItem value="ADMIN">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expire dans</Label>
                  <Select
                    value={formData.expiresInDays}
                    onValueChange={(value) =>
                      setFormData({ ...formData, expiresInDays: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 jour</SelectItem>
                      <SelectItem value="7">7 jours</SelectItem>
                      <SelectItem value="30">30 jours</SelectItem>
                      <SelectItem value="90">90 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600"
                  disabled={saving || !formData.teamId}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    "Générer le lien"
                  )}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-500" />
            Invitations ({invitations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Équipe</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Expire le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => {
                const isExpired = new Date() > new Date(invitation.expiresAt);
                const status = invitation.used
                  ? "Utilisé"
                  : isExpired
                  ? "Expiré"
                  : "Actif";
                const statusColor = invitation.used
                  ? "bg-blue-500"
                  : isExpired
                  ? "bg-red-500"
                  : "bg-green-500";

                return (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.team?.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ROLE_LABELS[invitation.role as keyof typeof ROLE_LABELS]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColor} text-white`}>
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(invitation.expiresAt), "dd/MM/yyyy", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {!invitation.used && !isExpired && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(invitation.token)}
                        >
                          {copied === invitation.token ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(invitation.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {invitations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Aucune invitation générée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

