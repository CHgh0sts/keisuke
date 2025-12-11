import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer tous les utilisateurs sauf l'utilisateur actuel
    const users = await prisma.user.findMany({
      where: {
        id: { not: user.id },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users list:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

