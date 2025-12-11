export type UserRole = "ADMIN" | "SUPERVISOR" | "OPERATOR";

export type ReportStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SUSPENDED" | "ERROR";

export type ConversationType = "GLOBAL" | "TEAM" | "PRIVATE";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  teamId: string | null;
  team?: Team | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  quaiId: string | null;
  quai?: Quai | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quai {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  destination: string;
  clientId: string | null;
  client?: Client | null;
  fromQuaiId: string;
  fromQuai?: Quai;
  toQuaiId: string;
  toQuai?: Quai;
  photo: string | null;
  status: ReportStatus;
  createdById: string;
  createdBy?: User;
  assignedToId: string | null;
  assignedTo?: User | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  teamId: string | null;
  team?: Team | null;
  participants?: ConversationParticipant[];
  messages?: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  user?: User;
  joinedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  conversationId: string;
  conversation?: Conversation;
  senderId: string;
  sender?: User;
  createdAt: Date;
  readBy?: MessageRead[];
}

export interface MessageRead {
  id: string;
  messageId: string;
  userId: string;
  readAt: Date;
}

export interface InvitationToken {
  id: string;
  token: string;
  teamId: string;
  team?: Team;
  role: UserRole;
  used: boolean;
  usedAt: Date | null;
  usedBy: string | null;
  expiresAt: Date;
  createdAt: Date;
}

// Status labels en français
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: "Non pris en charge",
  IN_PROGRESS: "En cours d'acheminement",
  COMPLETED: "Terminé",
  SUSPENDED: "Suspendu",
  ERROR: "Erreur survenue",
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  PENDING: "bg-yellow-500",
  IN_PROGRESS: "bg-blue-500",
  COMPLETED: "bg-green-500",
  SUSPENDED: "bg-orange-500",
  ERROR: "bg-red-500",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrateur",
  SUPERVISOR: "Superviseur",
  OPERATOR: "Opérateur de quai",
};

