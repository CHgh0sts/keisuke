import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "canManageQuais")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    const { name, code } = await request.json();

    const quai = await prisma.quai.update({
      where: { id },
      data: { name, code: code?.toUpperCase() },
    });

    return NextResponse.json(quai);
  } catch (error) {
    console.error("Error updating quai:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "canManageQuais")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.quai.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quai:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

