"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  PackageSearch,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Report, REPORT_STATUS_LABELS, REPORT_STATUS_COLORS, ReportStatus } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  suspended: number;
  error: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    suspended: 0,
    error: 0,
  });
  const [recentReports, setRecentReports] = useState<Report[]>([]);

  useEffect(() => {
    if (user && !hasPermission(user.role, "canViewDashboard")) {
      router.push("/reports");
      return;
    }
    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/reports?limit=100");
      const reports: Report[] = await response.json();

      const newStats: Stats = {
        total: reports.length,
        pending: reports.filter((r) => r.status === "PENDING").length,
        inProgress: reports.filter((r) => r.status === "IN_PROGRESS").length,
        completed: reports.filter((r) => r.status === "COMPLETED").length,
        suspended: reports.filter((r) => r.status === "SUSPENDED").length,
        error: reports.filter((r) => r.status === "ERROR").length,
      };

      setStats(newStats);
      setRecentReports(reports.slice(0, 5));
    } catch (error) {
      toast.error("Erreur lors du chargement du tableau de bord");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total signalements",
      value: stats.total,
      icon: PackageSearch,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "En attente",
      value: stats.pending,
      icon: Clock,
      color: "from-yellow-500 to-orange-500",
    },
    {
      title: "En cours",
      value: stats.inProgress,
      icon: Truck,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Terminés",
      value: stats.completed,
      icon: CheckCircle,
      color: "from-emerald-500 to-green-500",
    },
    {
      title: "Suspendus",
      value: stats.suspended,
      icon: AlertTriangle,
      color: "from-orange-500 to-amber-500",
    },
    {
      title: "Erreurs",
      value: stats.error,
      icon: AlertTriangle,
      color: "from-red-500 to-rose-500",
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble des signalements
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`}
            />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Répartition des statuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(REPORT_STATUS_LABELS).map(([status, label]) => {
                const count =
                  stats[
                    status.toLowerCase().replace("_", "") as keyof typeof stats
                  ] || 0;
                const percentage =
                  stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{label}</span>
                      <span className="font-medium">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${REPORT_STATUS_COLORS[status as ReportStatus]} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-500" />
              Signalements récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm line-clamp-1">
                      {report.destination}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {report.fromQuai?.name} → {report.toQuai?.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge
                      className={`${REPORT_STATUS_COLORS[report.status as ReportStatus]} text-white text-xs`}
                    >
                      {REPORT_STATUS_LABELS[report.status as ReportStatus]}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(report.createdAt), "dd/MM HH:mm", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {recentReports.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Aucun signalement récent
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

