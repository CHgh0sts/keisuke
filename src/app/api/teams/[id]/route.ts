import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "canManageTeams")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    const { name, quaiId } = await request.json();

    const team = await prisma.team.update({
      where: { id },
      data: { name, quaiId },
      include: { quai: true },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "canManageTeams")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;

    // Supprimer la conversation d'équipe associée
    await prisma.conversation.deleteMany({
      where: { type: "TEAM", teamId: id },
    });

    await prisma.team.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

