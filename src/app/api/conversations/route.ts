import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer les conversations où l'utilisateur est participant
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          // Chat global
          { type: "GLOBAL" },
          // Chat d'équipe de l'utilisateur
          { type: "TEAM", teamId: user.teamId },
          // Conversations privées où l'utilisateur participe
          {
            type: "PRIVATE",
            participants: {
              some: { userId: user.id },
            },
          },
        ],
      },
      include: {
        team: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Calculer les messages non lus
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: user.id },
            readBy: {
              none: { userId: user.id },
            },
          },
        });

        return {
          ...conv,
          unreadCount,
        };
      })
    );

    return NextResponse.json(conversationsWithUnread);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { type, participantId } = await request.json();

    if (type === "PRIVATE" && participantId) {
      // Vérifier si une conversation privée existe déjà entre ces deux utilisateurs
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: "PRIVATE",
          AND: [
            { participants: { some: { userId: user.id } } },
            { participants: { some: { userId: participantId } } },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (existingConversation) {
        return NextResponse.json(existingConversation);
      }

      // Créer une nouvelle conversation privée
      const conversation = await prisma.conversation.create({
        data: {
          type: "PRIVATE",
          participants: {
            create: [{ userId: user.id }, { userId: participantId }],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json(conversation, { status: 201 });
    }

    return NextResponse.json({ error: "Type de conversation invalide" }, { status: 400 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

