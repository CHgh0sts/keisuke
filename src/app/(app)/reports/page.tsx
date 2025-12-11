"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Loader2,
  Camera,
  Truck,
  ArrowRight,
  Clock,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Report, Quai, Client, REPORT_STATUS_LABELS, REPORT_STATUS_COLORS, ReportStatus } from "@/types";
import { hasPermission } from "@/lib/permissions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [quais, setQuais] = useState<Quai[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    destination: "",
    clientId: "",
    newClientName: "",
    fromQuaiId: "",
    toQuaiId: "",
    photo: "",
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      const [reportsRes, quaisRes, clientsRes] = await Promise.all([
        fetch(`/api/reports?status=${statusFilter}`),
        fetch("/api/quais"),
        fetch("/api/clients"),
      ]);

      const [reportsData, quaisData, clientsData] = await Promise.all([
        reportsRes.json(),
        quaisRes.json(),
        clientsRes.json(),
      ]);

      setReports(reportsData);
      setQuais(quaisData);
      setClients(clientsData);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      let clientId = formData.clientId;

      // Créer un nouveau client si nécessaire
      if (formData.newClientName && !clientId) {
        const clientRes = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formData.newClientName }),
        });
        if (clientRes.ok) {
          const newClient = await clientRes.json();
          clientId = newClient.id;
          setClients([...clients, newClient]);
        }
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: formData.destination,
          clientId: clientId || null,
          fromQuaiId: formData.fromQuaiId,
          toQuaiId: formData.toQuaiId,
          photo: formData.photo || null,
        }),
      });

      if (response.ok) {
        const newReport = await response.json();
        setReports([newReport, ...reports]);
        setIsCreateOpen(false);
        setFormData({
          destination: "",
          clientId: "",
          newClientName: "",
          fromQuaiId: "",
          toQuaiId: "",
          photo: "",
        });
        toast.success("Signalement créé avec succès");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la création");
      }
    } catch (error) {
      toast.error("Erreur lors de la création du signalement");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedReport = await response.json();
        setReports(reports.map((r) => (r.id === reportId ? updatedReport : r)));
        if (selectedReport?.id === reportId) {
          setSelectedReport(updatedReport);
        }
        toast.success("Statut mis à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.fromQuai?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.toQuai?.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const canEditReport = user && hasPermission(user.role, "canEditReport");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Signalements</h1>
          <p className="text-muted-foreground">
            Gérez les palettes mal positionnées
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau signalement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un signalement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Textarea
                  id="destination"
                  placeholder="Description de la destination..."
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Client</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, clientId: value, newClientName: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner ou créer un client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ Nouveau client</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.clientId === "new" && (
                  <Input
                    placeholder="Nom du nouveau client"
                    value={formData.newClientName}
                    onChange={(e) =>
                      setFormData({ ...formData, newClientName: e.target.value, clientId: "" })
                    }
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quai de départ</Label>
                  <Select
                    value={formData.fromQuaiId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, fromQuaiId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {quais.map((quai) => (
                        <SelectItem key={quai.id} value={quai.id}>
                          {quai.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quai d&apos;arrivée</Label>
                  <Select
                    value={formData.toQuaiId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, toQuaiId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {quais.map((quai) => (
                        <SelectItem key={quai.id} value={quai.id}>
                          {quai.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Photo (optionnel)</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("photo-input")?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {formData.photo ? "Changer" : "Ajouter"}
                  </Button>
                  {formData.photo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, photo: "" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <input
                    id="photo-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
                {formData.photo && (
                  <img
                    src={formData.photo}
                    alt="Preview"
                    className="mt-2 w-full h-40 object-cover rounded-lg"
                  />
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Créer le signalement"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            {Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredReports.map((report) => (
          <Card
            key={report.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedReport(report)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base line-clamp-1">
                    {report.destination}
                  </CardTitle>
                  {report.client && (
                    <p className="text-sm text-muted-foreground">
                      Client: {report.client.name}
                    </p>
                  )}
                </div>
                <Badge
                  className={`${REPORT_STATUS_COLORS[report.status as ReportStatus]} text-white`}
                >
                  {REPORT_STATUS_LABELS[report.status as ReportStatus]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{report.fromQuai?.name}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{report.toQuai?.name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(report.createdAt), "dd/MM HH:mm", { locale: fr })}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {report.createdBy?.firstName} {report.createdBy?.lastName}
                </div>
              </div>
              {report.photo && (
                <img
                  src={report.photo}
                  alt="Photo palette"
                  className="w-full h-24 object-cover rounded-md"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucun signalement trouvé</p>
        </div>
      )}

      {/* Report Detail Dialog */}
      <Dialog
        open={!!selectedReport}
        onOpenChange={() => setSelectedReport(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Détail du signalement</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 pr-4">
                <div>
                  <Label className="text-muted-foreground">Destination</Label>
                  <p className="font-medium">{selectedReport.destination}</p>
                </div>

                {selectedReport.client && (
                  <div>
                    <Label className="text-muted-foreground">Client</Label>
                    <p className="font-medium">{selectedReport.client.name}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Quai de départ</Label>
                    <p className="font-medium">{selectedReport.fromQuai?.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Quai d&apos;arrivée</Label>
                    <p className="font-medium">{selectedReport.toQuai?.name}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  <Select
                    value={selectedReport.status}
                    onValueChange={(value) =>
                      handleStatusChange(selectedReport.id, value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Créé par</Label>
                    <p className="font-medium">
                      {selectedReport.createdBy?.firstName}{" "}
                      {selectedReport.createdBy?.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p className="font-medium">
                      {format(new Date(selectedReport.createdAt), "dd/MM/yyyy HH:mm", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>

                {selectedReport.photo && (
                  <div>
                    <Label className="text-muted-foreground">Photo</Label>
                    <img
                      src={selectedReport.photo}
                      alt="Photo palette"
                      className="mt-2 w-full rounded-lg"
                    />
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

