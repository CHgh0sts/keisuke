import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Créer l'admin par défaut
  const hashedPassword = await bcrypt.hash("admin123", 12);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@quaitrack.com" },
    update: {},
    create: {
      email: "admin@quaitrack.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "QuaiTrack",
      role: "ADMIN",
    },
  });

  console.log("✅ Admin created:", admin.email);

  // Créer quelques quais par défaut
  const quais = await Promise.all([
    prisma.quai.upsert({
      where: { code: "Q1" },
      update: {},
      create: { name: "Quai 1", code: "Q1" },
    }),
    prisma.quai.upsert({
      where: { code: "Q2" },
      update: {},
      create: { name: "Quai 2", code: "Q2" },
    }),
    prisma.quai.upsert({
      where: { code: "Q3" },
      update: {},
      create: { name: "Quai 3", code: "Q3" },
    }),
    prisma.quai.upsert({
      where: { code: "Q4" },
      update: {},
      create: { name: "Quai 4", code: "Q4" },
    }),
  ]);

  console.log("✅ Quais created:", quais.length);

  // Créer une équipe par défaut
  const team = await prisma.team.upsert({
    where: { name: "Équipe Principale" },
    update: {},
    create: {
      name: "Équipe Principale",
      quaiId: quais[0].id,
    },
  });

  console.log("✅ Team created:", team.name);

  // Associer l'admin à l'équipe
  await prisma.user.update({
    where: { id: admin.id },
    data: { teamId: team.id },
  });

  // Créer la conversation globale
  const globalConversation = await prisma.conversation.upsert({
    where: { id: "global-chat" },
    update: {},
    create: {
      id: "global-chat",
      type: "GLOBAL",
      name: "Chat Global",
    },
  });

  console.log("✅ Global conversation created");

  // Créer la conversation d'équipe
  let teamConversation = await prisma.conversation.findFirst({
    where: { type: "TEAM", teamId: team.id },
  });

  if (!teamConversation) {
    teamConversation = await prisma.conversation.create({
      data: {
        type: "TEAM",
        name: `Équipe ${team.name}`,
        teamId: team.id,
      },
    });
    console.log("✅ Team conversation created");
  }

  // Ajouter l'admin aux conversations
  await prisma.conversationParticipant.upsert({
    where: {
      conversationId_userId: {
        conversationId: globalConversation.id,
        userId: admin.id,
      },
    },
    update: {},
    create: {
      conversationId: globalConversation.id,
      userId: admin.id,
    },
  });

  await prisma.conversationParticipant.upsert({
    where: {
      conversationId_userId: {
        conversationId: teamConversation.id,
        userId: admin.id,
      },
    },
    update: {},
    create: {
      conversationId: teamConversation.id,
      userId: admin.id,
    },
  });

  console.log("✅ Admin added to conversations");

  // Créer quelques clients par défaut
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { name: "Client A" },
      update: {},
      create: { name: "Client A" },
    }),
    prisma.client.upsert({
      where: { name: "Client B" },
      update: {},
      create: { name: "Client B" },
    }),
    prisma.client.upsert({
      where: { name: "Client C" },
      update: {},
      create: { name: "Client C" },
    }),
  ]);

  console.log("✅ Clients created:", clients.length);

  console.log("🎉 Seeding completed!");
  console.log("");
  console.log("📧 Admin credentials:");
  console.log("   Email: admin@quaitrack.com");
  console.log("   Password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
