import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    // Récupérer tous les messages non lus de cette conversation
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId: id,
        senderId: { not: user.id },
        readBy: {
          none: { userId: user.id },
        },
      },
      select: { id: true },
    });

    // Marquer tous les messages comme lus (un par un pour SQLite)
    if (unreadMessages.length > 0) {
      await Promise.all(
        unreadMessages.map((msg) =>
          prisma.messageRead.upsert({
            where: {
              messageId_userId: {
                messageId: msg.id,
                userId: user.id,
              },
            },
            update: {},
            create: {
              messageId: msg.id,
              userId: user.id,
            },
          })
        )
      );
    }

    return NextResponse.json({ success: true, count: unreadMessages.length });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
