# QuaiTrack - Système de gestion des palettes

Application Next.js pour signaler et suivre les palettes mal positionnées sur les quais de chargement, avec un système de messagerie instantanée.

## 🚀 Fonctionnalités

### Authentification
- Système de connexion/inscription sécurisé (JWT)
- Inscription via liens d'invitation avec token unique
- 3 rôles : Administrateur, Superviseur, Opérateur de quai

### Signalements de palettes
- Création de signalements avec destination, client, quais (départ/arrivée)
- Upload de photos (stockées en base64)
- 5 statuts : Non pris en charge, En cours, Terminé, Suspendu, Erreur
- Filtrage et recherche

### Messagerie instantanée (Socket.io)
- Chat global (tous les quais)
- Chat d'équipe
- Messages privés
- Indicateur de messages non lus (bulle rouge avec compteur)

### Administration
- Gestion des quais (CRUD)
- Gestion des clients
- Gestion des équipes
- Génération de liens d'invitation
- Gestion des utilisateurs

### Interface
- Mode clair/sombre
- Design responsive (mobile-first)
- UI moderne avec shadcn/ui

## 🛠️ Technologies

- **Frontend** : Next.js 16, React 19, TypeScript
- **UI** : shadcn/ui, Tailwind CSS, Lucide Icons
- **Base de données** : SQLite avec Prisma ORM
- **Authentification** : JWT (jsonwebtoken), bcryptjs
- **Temps réel** : Socket.io
- **Thème** : next-themes

## 📦 Installation

```bash
# Cloner le projet
git clone <repo-url>
cd quaitrack

# Installer les dépendances
npm install

# Créer la base de données
npm run db:push

# Initialiser avec des données de test
npm run db:seed

# Lancer le serveur de développement
npm run dev
```

## 🔐 Compte Admin par défaut

Après le seed, vous pouvez vous connecter avec :

- **Email** : admin@quaitrack.com
- **Mot de passe** : admin123

## 📁 Structure du projet

```
src/
├── app/
│   ├── (auth)/           # Pages d'authentification
│   │   ├── login/
│   │   └── register/
│   ├── (app)/            # Pages de l'application (protégées)
│   │   ├── dashboard/
│   │   ├── reports/
│   │   ├── chat/
│   │   └── admin/
│   │       ├── quais/
│   │       ├── clients/
│   │       ├── teams/
│   │       ├── invitations/
│   │       └── users/
│   └── api/              # Routes API
│       ├── auth/
│       ├── quais/
│       ├── clients/
│       ├── teams/
│       ├── reports/
│       ├── conversations/
│       ├── invitations/
│       └── users/
├── components/
│   ├── ui/               # Composants shadcn/ui
│   ├── providers.tsx
│   ├── sidebar.tsx
│   └── theme-toggle.tsx
├── contexts/
│   └── auth-context.tsx
├── hooks/
│   └── use-socket.ts
├── lib/
│   ├── auth.ts
│   ├── permissions.ts
│   ├── prisma.ts
│   └── utils.ts
├── types/
│   └── index.ts
prisma/
├── schema.prisma
└── dev.db
scripts/
└── seed.ts
server.js                 # Serveur Socket.io
```

## 🔑 Permissions par rôle

| Fonctionnalité | Admin | Superviseur | Opérateur |
|---|:---:|:---:|:---:|
| Gérer utilisateurs/équipes | ✅ | ❌ | ❌ |
| Gérer quais/clients | ✅ | ❌ | ❌ |
| Générer liens d'invitation | ✅ | ❌ | ❌ |
| Créer signalement | ✅ | ✅ | ✅ |
| Modifier signalement complet | ✅ | ✅ | ❌ |
| Modifier statut uniquement | ✅ | ✅ | ✅ |
| Voir dashboard stats | ✅ | ✅ | ❌ |
| Chat | ✅ | ✅ | ✅ |

## 📝 Scripts npm

```bash
npm run dev        # Serveur de développement avec Socket.io
npm run dev:next   # Serveur Next.js uniquement
npm run build      # Build de production
npm run start      # Serveur de production
npm run db:push    # Synchroniser le schéma Prisma
npm run db:seed    # Initialiser la base de données
npm run db:studio  # Interface Prisma Studio
npm run lint       # Linting
```

## 🌐 Variables d'environnement

Créez un fichier `.env` à la racine :

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

## 📱 Responsive Design

L'application est conçue mobile-first avec :
- Navigation latérale sur desktop
- Menu hamburger sur mobile
- Chat adaptatif (liste/conversation en plein écran sur mobile)

## 🎨 Thème

Basculez entre le mode clair et sombre via le bouton dans la sidebar.
Le thème est persisté dans les préférences utilisateur.

---

Développé avec ❤️ pour la gestion logistique des quais.
