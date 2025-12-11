import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        quai: true,
        _count: { select: { users: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "canManageTeams")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { name, quaiId } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: { name, quaiId },
      include: { quai: true },
    });

    // Créer une conversation d'équipe
    const teamConversation = await prisma.conversation.create({
      data: {
        type: "TEAM",
        name: `Équipe ${name}`,
        teamId: team.id,
      },
    });

    // S'assurer qu'une conversation globale existe
    let globalConversation = await prisma.conversation.findFirst({
      where: { type: "GLOBAL" },
    });

    if (!globalConversation) {
      globalConversation = await prisma.conversation.create({
        data: {
          type: "GLOBAL",
          name: "Chat Global",
        },
      });
    }

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Cette équipe existe déjà" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

