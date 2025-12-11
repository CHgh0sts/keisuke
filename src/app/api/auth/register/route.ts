import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { token, email, password, firstName, lastName } = await request.json();

    if (!token || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    // Vérifier le token d'invitation
    const invitation = await prisma.invitationToken.findUnique({
      where: { token },
      include: { team: true },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Token d'invitation invalide" },
        { status: 400 }
      );
    }

    if (invitation.used) {
      return NextResponse.json(
        { error: "Ce token d'invitation a déjà été utilisé" },
        { status: 400 }
      );
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: "Ce token d'invitation a expiré" },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 400 }
      );
    }

    // Créer l'utilisateur
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: invitation.role,
        teamId: invitation.teamId,
      },
      include: { team: true },
    });

    // Marquer le token comme utilisé
    await prisma.invitationToken.update({
      where: { id: invitation.id },
      data: {
        used: true,
        usedAt: new Date(),
        usedBy: user.id,
      },
    });

    // Ajouter l'utilisateur aux conversations existantes de son équipe
    if (user.teamId) {
      // Conversation globale
      const globalConversation = await prisma.conversation.findFirst({
        where: { type: "GLOBAL" },
      });
      if (globalConversation) {
        await prisma.conversationParticipant.create({
          data: {
            conversationId: globalConversation.id,
            userId: user.id,
          },
        });
      }

      // Conversation d'équipe
      const teamConversation = await prisma.conversation.findFirst({
        where: { type: "TEAM", teamId: user.teamId },
      });
      if (teamConversation) {
        await prisma.conversationParticipant.create({
          data: {
            conversationId: teamConversation.id,
            userId: user.id,
          },
        });
      }
    }

    const authToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        team: user.team,
      },
    });

    response.cookies.set("auth-token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

