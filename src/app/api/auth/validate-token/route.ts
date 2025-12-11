import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token manquant" },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitationToken.findUnique({
      where: { token },
      include: { team: true },
    });

    if (!invitation) {
      return NextResponse.json(
        { valid: false, error: "Token invalide" },
        { status: 400 }
      );
    }

    if (invitation.used) {
      return NextResponse.json(
        { valid: false, error: "Token déjà utilisé" },
        { status: 400 }
      );
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { valid: false, error: "Token expiré" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      team: invitation.team,
      role: invitation.role,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

