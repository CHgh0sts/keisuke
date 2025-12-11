"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { hasPermission, type Permission } from "@/lib/permissions";
import {
  LayoutDashboard,
  PackageSearch,
  MessageSquare,
  Users,
  Building2,
  UserPlus,
  Settings,
  LogOut,
  Truck,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { ROLE_LABELS } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, permission: "canViewDashboard" },
  { href: "/reports", label: "Signalements", icon: PackageSearch },
  { href: "/chat", label: "Messagerie", icon: MessageSquare },
  { href: "/admin/quais", label: "Quais", icon: Truck, permission: "canManageQuais" },
  { href: "/admin/clients", label: "Clients", icon: Building2, permission: "canManageClients" },
  { href: "/admin/teams", label: "Équipes", icon: Users, permission: "canManageTeams" },
  { href: "/admin/invitations", label: "Invitations", icon: UserPlus, permission: "canGenerateInvites" },
  { href: "/admin/users", label: "Utilisateurs", icon: Settings, permission: "canManageUsers" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return user && hasPermission(user.role, item.permission as Permission);
  });

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {filteredItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserSection({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();

  if (!user) return null;

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <div className="border-t p-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-600">
          <AvatarFallback className="bg-transparent text-white font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout} className="h-8 w-8">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-4">
        <Link href="/reports" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <PackageSearch className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            QuaiTrack
          </span>
        </Link>
        <ThemeToggle />
      </div>
      <NavLinks onNavigate={onNavigate} />
      <UserSection onLogout={handleLogout} />
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 lg:hidden">
        <Link href="/reports" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <PackageSearch className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            QuaiTrack
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 border-r bg-card">
        <SidebarContent />
      </aside>
    </>
  );
}

