import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission, generateInvitationToken } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "canGenerateInvites")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const invitations = await prisma.invitationToken.findMany({
      include: { team: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "canGenerateInvites")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { teamId, role, expiresInDays = 7 } = await request.json();

    if (!teamId || !role) {
      return NextResponse.json({ error: "Équipe et rôle requis" }, { status: 400 });
    }

    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invitation = await prisma.invitationToken.create({
      data: {
        token,
        teamId,
        role,
        expiresAt,
      },
      include: { team: true },
    });

    // Générer l'URL complète
    const baseUrl = request.headers.get("origin") || "http://localhost:3000";
    const invitationUrl = `${baseUrl}/register?token=${token}`;

    return NextResponse.json({
      ...invitation,
      url: invitationUrl,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

