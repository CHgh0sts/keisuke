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
import { Plus, Loader2, Pencil, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { Quai } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function QuaisPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [quais, setQuais] = useState<Quai[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Quai | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !hasPermission(user.role, "canManageQuais")) {
      router.push("/reports");
      return;
    }
    fetchQuais();
  }, [user, router]);

  const fetchQuais = async () => {
    try {
      const response = await fetch("/api/quais");
      const data = await response.json();
      setQuais(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des quais");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editing ? `/api/quais/${editing.id}` : "/api/quais";
      const method = editing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const quai = await response.json();
        if (editing) {
          setQuais(quais.map((q) => (q.id === quai.id ? quai : q)));
        } else {
          setQuais([...quais, quai]);
        }
        setIsOpen(false);
        setEditing(null);
        setFormData({ name: "", code: "" });
        toast.success(editing ? "Quai modifié" : "Quai créé");
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
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce quai ?")) return;

    try {
      const response = await fetch(`/api/quais/${id}`, { method: "DELETE" });
      if (response.ok) {
        setQuais(quais.filter((q) => q.id !== id));
        toast.success("Quai supprimé");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const openEdit = (quai: Quai) => {
    setEditing(quai);
    setFormData({ name: quai.name, code: quai.code });
    setIsOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: "", code: "" });
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
          <h1 className="text-2xl font-bold">Gestion des quais</h1>
          <p className="text-muted-foreground">
            Configurez les quais de chargement
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un quai
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Modifier le quai" : "Nouveau quai"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du quai</Label>
                <Input
                  id="name"
                  placeholder="ex: Quai Nord 1"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  placeholder="ex: QN1"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
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
            <Truck className="h-5 w-5 text-emerald-500" />
            Liste des quais ({quais.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quais.map((quai) => (
                <TableRow key={quai.id}>
                  <TableCell className="font-medium">{quai.name}</TableCell>
                  <TableCell>
                    <code className="px-2 py-1 bg-muted rounded text-sm">
                      {quai.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    {format(new Date(quai.createdAt), "dd/MM/yyyy", {
                      locale: fr,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(quai)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(quai.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {quais.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Aucun quai configuré
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

