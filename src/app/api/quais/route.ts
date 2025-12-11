import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";

export async function GET() {
  try {
    const quais = await prisma.quai.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(quais);
  } catch (error) {
    console.error("Error fetching quais:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "canManageQuais")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { name, code } = await request.json();

    if (!name || !code) {
      return NextResponse.json({ error: "Nom et code requis" }, { status: 400 });
    }

    const quai = await prisma.quai.create({
      data: { name, code: code.toUpperCase() },
    });

    return NextResponse.json(quai, { status: 201 });
  } catch (error) {
    console.error("Error creating quai:", error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ce nom ou code existe déjà" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

