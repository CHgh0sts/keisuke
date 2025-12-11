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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Client } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ClientsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !hasPermission(user.role, "canManageClients")) {
      router.push("/reports");
      return;
    }
    fetchClients();
  }, [user, router]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      const data = await response.json();
      setClients(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editing ? `/api/clients/${editing.id}` : "/api/clients";
      const method = editing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const client = await response.json();
        if (editing) {
          setClients(clients.map((c) => (c.id === client.id ? client : c)));
        } else {
          setClients([...clients, client]);
        }
        setIsOpen(false);
        setEditing(null);
        setFormData({ name: "" });
        toast.success(editing ? "Client modifié" : "Client créé");
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
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) return;

    try {
      const response = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (response.ok) {
        setClients(clients.filter((c) => c.id !== id));
        toast.success("Client supprimé");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setFormData({ name: client.name });
    setIsOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: "" });
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
          <h1 className="text-2xl font-bold">Gestion des clients</h1>
          <p className="text-muted-foreground">
            Configurez les clients pour les signalements
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Modifier le client" : "Nouveau client"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du client</Label>
                <Input
                  id="name"
                  placeholder="ex: Entreprise ABC"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
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
            <Building2 className="h-5 w-5 text-emerald-500" />
            Liste des clients ({clients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    {format(new Date(client.createdAt), "dd/MM/yyyy", {
                      locale: fr,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(client)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(client.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    Aucun client configuré
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

