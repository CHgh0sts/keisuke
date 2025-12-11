import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";

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

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        client: true,
        fromQuai: true,
        toQuai: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Signalement non trouvé" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Vérifier les permissions
    const canEditFull = hasPermission(user.role, "canEditReport");
    const canEditStatus = hasPermission(user.role, "canEditReportStatus");

    if (!canEditFull && !canEditStatus) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Si l'utilisateur ne peut modifier que le statut, filtrer les champs
    let updateData: {
      status?: string;
      destination?: string;
      clientId?: string | null;
      fromQuaiId?: string;
      toQuaiId?: string;
      photo?: string | null;
      assignedToId?: string | null;
    };
    if (canEditFull) {
      updateData = {
        status: body.status,
        destination: body.destination,
        clientId: body.clientId,
        fromQuaiId: body.fromQuaiId,
        toQuaiId: body.toQuaiId,
        photo: body.photo,
        assignedToId: body.assignedToId,
      };
    } else {
      // Opérateur: uniquement le statut
      updateData = { status: body.status };
    }

    // Nettoyer les undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const report = await prisma.report.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        fromQuai: true,
        toQuai: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "canEditReport")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.report.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

