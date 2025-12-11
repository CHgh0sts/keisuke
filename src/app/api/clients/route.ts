import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Les opérateurs peuvent aussi créer des clients (lors de la création d'un signalement)
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: { name },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ce client existe déjà" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

