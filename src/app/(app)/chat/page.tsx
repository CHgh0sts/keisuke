"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/hooks/use-socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  Send,
  MessageSquare,
  Users,
  Globe,
  User,
  Plus,
  Search,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  type: "GLOBAL" | "TEAM" | "PRIVATE";
  name: string | null;
  team?: { id: string; name: string } | null;
  participants?: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  messages?: Array<{
    content: string;
    sender: {
      firstName: string;
      lastName: string;
    };
  }>;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  readBy?: Array<{ userId: string }>;
}

interface UserListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  team?: { id: string; name: string } | null;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { subscribe, isConnected } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Subscribe to new messages
    const unsubscribe = subscribe("new-message", (data: unknown) => {
      const message = data as Message;
      if (message.conversationId === selectedConversation?.id) {
        // Avoid duplicate messages
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
        scrollToBottom();
      }
      
      // Update conversation list
      fetchConversations();
    });

    return unsubscribe;
  }, [subscribe, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations");
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/conversations/${conversationId}/read`, { method: "POST" });
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users/list");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des utilisateurs");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const response = await fetch(
        `/api/conversations/${selectedConversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: messageContent }),
        }
      );

      if (response.ok) {
        const message = await response.json();
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
        fetchConversations();
      } else {
        toast.error("Erreur lors de l'envoi");
        setNewMessage(messageContent);
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
      setNewMessage(messageContent);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleStartPrivateChat = async (userId: string) => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "PRIVATE", participantId: userId }),
      });

      if (response.ok) {
        const conversation = await response.json();
        await fetchConversations();
        const fullConversation = conversations.find((c) => c.id === conversation.id) || {
          ...conversation,
          unreadCount: 0,
        };
        setSelectedConversation(fullConversation);
        setShowNewChat(false);
        setShowMobileChat(true);
      }
    } catch (error) {
      toast.error("Erreur lors de la création de la conversation");
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.type === "GLOBAL") return "Chat Global";
    if (conv.type === "TEAM") return conv.name || `Équipe ${conv.team?.name}`;
    if (conv.type === "PRIVATE") {
      const otherParticipant = conv.participants?.find((p) => p.user.id !== user?.id);
      if (otherParticipant) {
        return `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
      }
    }
    return "Conversation";
  };

  const getConversationIcon = (type: string) => {
    switch (type) {
      case "GLOBAL":
        return <Globe className="h-4 w-4" />;
      case "TEAM":
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.firstName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.lastName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-screen flex flex-col lg:flex-row">
      {/* Conversations List */}
      <div
        className={cn(
          "w-full lg:w-80 border-r bg-card flex flex-col",
          showMobileChat && "hidden lg:flex"
        )}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Messagerie</h1>
            <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    fetchUsers();
                  }}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un utilisateur..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleStartPrivateChat(u.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-left"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                              {u.firstName[0]}
                              {u.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {u.team?.name || "Sans équipe"}
                            </p>
                          </div>
                        </button>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          Aucun utilisateur trouvé
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500"
              )}
            />
            {isConnected ? "Connecté" : "Déconnecté"}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setSelectedConversation(conv);
                  setShowMobileChat(true);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                  selectedConversation?.id === conv.id
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    conv.type === "GLOBAL"
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                      : conv.type === "TEAM"
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                      : "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
                  )}
                >
                  {getConversationIcon(conv.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">
                      {getConversationName(conv)}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white text-xs ml-2 h-5 min-w-5 flex items-center justify-center">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                  {conv.messages?.[0] && (
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.messages[0].sender.firstName}: {conv.messages[0].content}
                    </p>
                  )}
                </div>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Aucune conversation
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div
        className={cn(
          "flex-1 flex flex-col bg-background",
          !showMobileChat && "hidden lg:flex"
        )}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b flex items-center gap-3 px-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setShowMobileChat(false)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  selectedConversation.type === "GLOBAL"
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                    : selectedConversation.type === "TEAM"
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                    : "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
                )}
              >
                {getConversationIcon(selectedConversation.type)}
              </div>
              <div>
                <h2 className="font-semibold">
                  {getConversationName(selectedConversation)}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.type === "GLOBAL"
                    ? "Tous les quais"
                    : selectedConversation.type === "TEAM"
                    ? "Chat d'équipe"
                    : "Conversation privée"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.senderId === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          isOwn && "flex-row-reverse"
                        )}
                      >
                        {!isOwn && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs">
                              {message.sender.firstName[0]}
                              {message.sender.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] space-y-1",
                            isOwn && "items-end"
                          )}
                        >
                          {!isOwn && (
                            <p className="text-xs text-muted-foreground">
                              {message.sender.firstName} {message.sender.lastName}
                            </p>
                          )}
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2",
                              isOwn
                                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                                : "bg-muted"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          </div>
                          <p
                            className={cn(
                              "text-xs text-muted-foreground",
                              isOwn && "text-right"
                            )}
                          >
                            {format(new Date(message.createdAt), "HH:mm", {
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <form
              onSubmit={handleSendMessage}
              className="border-t p-4 flex gap-2"
            >
              <Input
                ref={inputRef}
                placeholder="Écrivez un message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
                disabled={sending}
              />
              <Button
                type="submit"
                size="icon"
                className="bg-gradient-to-r from-emerald-500 to-teal-600"
                disabled={!newMessage.trim() || sending}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Messagerie</h2>
              <p className="text-muted-foreground">
                Sélectionnez une conversation pour commencer
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

