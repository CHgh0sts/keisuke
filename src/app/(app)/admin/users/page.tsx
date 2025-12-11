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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Pencil, Trash2, Settings } from "lucide-react";
import { toast } from "sonner";
import { User, Team, ROLE_LABELS, UserRole } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [formData, setFormData] = useState({ role: "", teamId: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser && !hasPermission(currentUser.role, "canManageUsers")) {
      router.push("/reports");
      return;
    }
    fetchData();
  }, [currentUser, router]);

  const fetchData = async () => {
    try {
      const [usersRes, teamsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/teams"),
      ]);
      const [usersData, teamsData] = await Promise.all([
        usersRes.json(),
        teamsRes.json(),
      ]);
      setUsers(usersData);
      setTeams(teamsData);
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/users/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: formData.role,
          teamId: formData.teamId || null,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
        setIsOpen(false);
        setEditing(null);
        toast.success("Utilisateur modifié");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur lors de la modification");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;

    try {
      const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (response.ok) {
        setUsers(users.filter((u) => u.id !== id));
        toast.success("Utilisateur supprimé");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setFormData({ role: user.role, teamId: user.teamId || "" });
    setIsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-500";
      case "SUPERVISOR":
        return "bg-blue-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
        <p className="text-muted-foreground">
          Gérez les comptes utilisateurs et leurs rôles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-500" />
            Utilisateurs ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Équipe</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
                const isCurrentUser = user.id === currentUser?.id;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {user.firstName} {user.lastName}
                          {isCurrentUser && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (vous)
                            </span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getRoleColor(user.role)} text-white`}>
                        {ROLE_LABELS[user.role as UserRole]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.team ? (
                        <Badge variant="outline">{user.team.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), "dd/MM/yyyy", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Aucun utilisateur
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">
                  {editing.firstName} {editing.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{editing.email}</p>
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
                <Label>Équipe</Label>
                <Select
                  value={formData.teamId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, teamId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une équipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
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
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

