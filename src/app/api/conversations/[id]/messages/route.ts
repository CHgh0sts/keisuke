import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const cursor = searchParams.get("cursor");

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        readBy: {
          select: {
            userId: true,
            readAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    return NextResponse.json(messages.reverse());
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

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
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        conversationId: id,
        senderId: user.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Mettre à jour la date de mise à jour de la conversation
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

