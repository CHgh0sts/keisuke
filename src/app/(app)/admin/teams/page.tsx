"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Loader2, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Team, Quai } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TeamWithCount extends Team {
  _count?: { users: number };
}

export default function TeamsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<TeamWithCount[]>([]);
  const [quais, setQuais] = useState<Quai[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [formData, setFormData] = useState({ name: "", quaiId: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !hasPermission(user.role, "canManageTeams")) {
      router.push("/reports");
      return;
    }
    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    try {
      const [teamsRes, quaisRes] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/quais"),
      ]);
      const [teamsData, quaisData] = await Promise.all([
        teamsRes.json(),
        quaisRes.json(),
      ]);
      setTeams(teamsData);
      setQuais(quaisData);
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
      const url = editing ? `/api/teams/${editing.id}` : "/api/teams";
      const method = editing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          quaiId: formData.quaiId || null,
        }),
      });

      if (response.ok) {
        await fetchData();
        setIsOpen(false);
        setEditing(null);
        setFormData({ name: "", quaiId: "" });
        toast.success(editing ? "Équipe modifiée" : "Équipe créée");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette équipe ?")) return;

    try {
      const response = await fetch(`/api/teams/${id}`, { method: "DELETE" });
      if (response.ok) {
        setTeams(teams.filter((t) => t.id !== id));
        toast.success("Équipe supprimée");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const openEdit = (team: Team) => {
    setEditing(team);
    setFormData({ name: team.name, quaiId: team.quaiId || "" });
    setIsOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: "", quaiId: "" });
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
          <h1 className="text-2xl font-bold">Gestion des équipes</h1>
          <p className="text-muted-foreground">
            Configurez les équipes de travail
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une équipe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Modifier l'équipe" : "Nouvelle équipe"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l&apos;équipe</Label>
                <Input
                  id="name"
                  placeholder="ex: Équipe Matin"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Quai associé (optionnel)</Label>
                <Select
                  value={formData.quaiId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, quaiId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un quai" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {quais.map((quai) => (
                      <SelectItem key={quai.id} value={quai.id}>
                        {quai.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : editing ? (
                  "Modifier"
                ) : (
                  "Créer"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            Liste des équipes ({teams.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Quai</TableHead>
                <TableHead>Membres</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>
                    {team.quai ? (
                      <Badge variant="outline">{team.quai.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{team._count?.users || 0} membres</Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(team.createdAt), "dd/MM/yyyy", {
                      locale: fr,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(team)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(team.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {teams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Aucune équipe configurée
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

