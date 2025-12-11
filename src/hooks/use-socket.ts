"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/auth-context";

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
}

export function useSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map());

  useEffect(() => {
    if (!user) return;

    // Créer la connexion Socket.io
    const socket = io({
      path: "/api/socket",
      addTrailingSlash: false,
      auth: {
        userId: user.id,
        teamId: user.teamId,
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      // Rejoindre les rooms appropriées
      socket.emit("join", {
        userId: user.id,
        teamId: user.teamId,
      });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Gérer les messages entrants
    socket.on("new-message", (message: Message) => {
      const listeners = listenersRef.current.get("new-message");
      if (listeners) {
        listeners.forEach((listener) => listener(message));
      }
    });

    socket.on("message-read", (data: { conversationId: string; userId: string }) => {
      const listeners = listenersRef.current.get("message-read");
      if (listeners) {
        listeners.forEach((listener) => listener(data));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const sendMessage = useCallback(
    (conversationId: string, content: string) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("send-message", {
          conversationId,
          content,
          senderId: user?.id,
        });
      }
    },
    [isConnected, user]
  );

  const markAsRead = useCallback(
    (conversationId: string) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("mark-read", {
          conversationId,
          userId: user?.id,
        });
      }
    },
    [isConnected, user]
  );

  const subscribe = useCallback((event: string, callback: (data: unknown) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    return () => {
      listenersRef.current.get(event)?.delete(callback);
    };
  }, []);

  return {
    isConnected,
    sendMessage,
    markAsRead,
    subscribe,
    socket: socketRef.current,
  };
}

