import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: { status?: string } = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const reports = await prisma.report.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { destination, clientId, fromQuaiId, toQuaiId, photo } = await request.json();

    if (!destination || !fromQuaiId || !toQuaiId) {
      return NextResponse.json({ error: "Destination, quai de départ et quai d'arrivée requis" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        destination,
        clientId,
        fromQuaiId,
        toQuaiId,
        photo,
        createdById: user.id,
        status: "PENDING",
      },
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
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

