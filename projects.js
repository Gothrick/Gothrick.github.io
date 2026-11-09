// CURATED PROJECTS (hand-written cards, with screenshots and bilingual text).
//
// New public repos on GitHub (github.com/Gothrick) appear on the site automatically:
// a GitHub Action (see README.md) builds a basic card for each one and adds it after
// these cards. To replace an automatic card with a polished one, copy a block below,
// paste it at the end of the list, and keep its `code` link pointing at the repo:
// the automatic card is then dropped. Everything except `title` is optional.
//
// Shown on the card:
//   title        Project name
//   description  One short sentence (keep it brief, the card is small)
//   tech         Technologies used, shown as small colored pills
//   image        Card screenshot, e.g. "images/my-project.png" (16:9 works best)
//   code         Link to the GitHub repo
//   live         Link to a live demo (leave out if there isn't one)
//   repo         "owner/name" on GitHub. If set, the real last-updated date is shown
//   updated      Fallback text if `repo` is not set, e.g. "Spring 2026"
//
// Languages: any text field (title, description, note, updated, details, highlights)
// can be plain text, or { en: "...", fr: "..." } to show a different text per language.
// See WireChat below. Plain text is shown in both languages.
//
// Shown in the details pop-up (click a card):
//   details      Longer description, one string per paragraph
//   highlights   Short bullet points: what you built, decisions, results
//   images       More screenshots, e.g. ["images/a.png", "images/b.png"]
//                (if empty, the card `image` is used)

const PROJECTS = [
  {
    title: "Sheet Happens",
    description: {
      en: "A D&D 5e character builder that applies the rules for you, from level 1 to 5.",
      fr: "Un créateur de personnages D&D 5e qui applique les règles pour vous, du niveau 1 à 5."
    },
    tech: ["PHP", "Laravel", "React", "Vite", "Tailwind CSS", "SQLite"],
    image: "images/sheet-happens-character-sheet.jpg",
    code: "https://github.com/Gothrick/Dnd_Character_Creater",
    live: "",
    repo: "Gothrick/Dnd_Character_Creater",
    updated: { en: "Fall 2026", fr: "Automne 2026" },
    details: {
      en: [
        "Sheet Happens is a full-stack web app for creating, editing, and levelling up Dungeons & Dragons 5e characters from level 1 to 5. Players pick a race, class, and background, and every derived value (modifiers, armor class, hit points, saving throws, skills, spell slots) is calculated automatically.",
        "A Laravel REST API enforces the Player's Handbook rules on the server, so an illegal character can't be saved. A React single-page app guides the player through an eight-step wizard with live validation, a level-up flow, and an English and French interface."
      ],
      fr: [
        "Sheet Happens est une application web full-stack pour créer, modifier et faire progresser des personnages de Donjons et Dragons 5e, du niveau 1 à 5. Le joueur choisit une race, une classe et un historique, et toutes les valeurs dérivées (modificateurs, classe d'armure, points de vie, jets de sauvegarde, compétences, emplacements de sorts) sont calculées automatiquement.",
        "Une API REST Laravel applique les règles du Player's Handbook côté serveur, de sorte qu'un personnage illégal ne peut pas être enregistré. Une application React à page unique guide le joueur dans un assistant en huit étapes avec validation en direct, un parcours de montée de niveau et une interface en anglais et en français."
      ]
    },
    highlights: {
      en: [
        "Server-side rule validator shared by the wizard's draft check and the save endpoints",
        "Token authentication with rate limiting, plus per-user theme and language settings",
        "204 backend tests (Pest) and 354 frontend tests (Vitest)"
      ],
      fr: [
        "Validateur de règles côté serveur partagé par la vérification du brouillon et les routes d'enregistrement",
        "Authentification par jeton avec limitation de débit, et préférences de thème et de langue par utilisateur",
        "204 tests backend (Pest) et 354 tests frontend (Vitest)"
      ]
    },
    images: [
      "images/sheet-happens-landing.jpg",
      "images/sheet-happens-dashboard.jpg",
      "images/sheet-happens-character-sheet.jpg",
      "images/sheet-happens-create-race.jpg",
      "images/sheet-happens-rules.jpg",
      "images/sheet-happens-character-sheet-mobile.jpg"
    ]
  },
  {
    title: "WireChat",
    description: {
      en: "A cross-platform messaging app with web, desktop, and mobile clients.",
      fr: "Une messagerie multiplateforme avec clients web, bureau et mobile."
    },
    tech: ["React", "React Native", "Electron", "Laravel", "GraphQL", "Docker"],
    image: "images/wirechat-server-channel.jpg",
    code: "https://github.com/Gothrick/WireChat",
    live: "",
    repo: "Gothrick/WireChat",
    updated: { en: "Fall 2026", fr: "Automne 2026" },
    details: {
      en: [
        "WireChat is a real-time chat platform with friends, direct messages, and servers with channels. One Laravel API (GraphQL and REST, with live updates over WebSockets) serves three clients: a React web app, an Electron desktop app, and an Expo mobile app.",
        "It started as a team course project at Cégep de Saint-Jean-sur-Richelieu. I took part in building the clients and the API and in the secure (TLS) infrastructure, and the team reviewed each other's code through pull requests. The repository gathers the API, web, desktop, and mobile apps, a data layer shared by web and mobile, and a Docker Compose setup."
      ],
      fr: [
        "WireChat est une plateforme de clavardage en temps réel : amis, messages privés et serveurs avec canaux. Une API Laravel (GraphQL et REST, avec des mises à jour en direct par WebSocket) alimente trois clients : une application web React, une application de bureau Electron et une application mobile Expo.",
        "Le projet est né comme projet d'équipe au Cégep de Saint-Jean-sur-Richelieu. J'ai participé au développement des clients et de l'API ainsi qu'à l'infrastructure sécurisée (TLS), et l'équipe révisait le code de chacun par demandes de fusion. Le dépôt regroupe l'API, les applications web, bureau et mobile, une couche de données partagée par le web et le mobile, et une configuration Docker Compose."
      ]
    },
    highlights: {
      en: [
        "One API, three clients: web, desktop, and mobile share the same real-time data layer",
        "GraphQL subscriptions over WebSockets for instant messages, typing, and unread counters",
        "Docker Compose stack with nginx and TLS, PostgreSQL, and Redis",
        "Automated tests on every part: Jest, node:test, and PHPUnit"
      ],
      fr: [
        "Une API, trois clients : le web, le bureau et le mobile partagent la même couche de données en temps réel",
        "Abonnements GraphQL par WebSocket pour les messages, la saisie et les compteurs de non lus",
        "Pile Docker Compose avec nginx et TLS, PostgreSQL et Redis",
        "Tests automatisés sur chaque volet : Jest, node:test et PHPUnit"
      ]
    },
    images: [
      "images/wirechat-server-channel.jpg",
      "images/wirechat-direct-messages.jpg",
      "images/wirechat-friends.jpg",
      "images/wirechat-login.jpg"
    ]
  },
  {
    title: "HTTP Server in C#",
    description: {
      en: "A web server built from scratch on raw TCP sockets, with sessions and compression.",
      fr: "Un serveur web écrit de zéro sur des sockets TCP, avec sessions et compression."
    },
    tech: ["C#", ".NET 8", "TCP", "xUnit"],
    image: "images/http-server-home.jpg",
    code: "https://github.com/Gothrick/C-_HTTP_Server",
    live: "",
    repo: "",
    updated: { en: "Spring 2025", fr: "Printemps 2025" },
    details: {
      en: [
        "A small HTTP/1.1 server written in C# directly on top of TCP sockets, with no web framework. It parses requests by hand, serves static files with the right content types, handles form posts, keeps visitors' sessions with cookies, and compresses responses with Gzip or Brotli.",
        "It began as a networking course lab done in a group. I later reorganized it into a solution with an automated test suite and fixed several problems, including a path traversal hole, unescaped user input, and incorrect line endings."
      ],
      fr: [
        "Un petit serveur HTTP/1.1 écrit en C# directement sur des sockets TCP, sans framework web. Il analyse les requêtes à la main, sert des fichiers statiques avec le bon type de contenu, traite les formulaires, garde les sessions des visiteurs avec des cookies et compresse les réponses en Gzip ou en Brotli.",
        "Il est né d'un laboratoire de réseaux réalisé en équipe. Je l'ai ensuite réorganisé en solution avec une suite de tests automatisés et corrigé plusieurs problèmes, dont une faille de traversée de chemin, des entrées non échappées et de mauvaises fins de ligne."
      ]
    },
    highlights: {
      en: [
        "HTTP parsing, routing, cookies, and sessions implemented without a framework",
        "Protection against path traversal and HTML injection",
        "27 automated tests, including integration tests against the real server"
      ],
      fr: [
        "Analyse HTTP, routage, cookies et sessions implémentés sans framework",
        "Protection contre la traversée de chemin et l'injection HTML",
        "27 tests automatisés, dont des tests d'intégration contre le vrai serveur"
      ]
    },
    images: [
      "images/http-server-home.jpg",
      "images/http-server-greeting.jpg"
    ]
  },
  {
    title: "pygit ZO: Git in Python",
    description: {
      en: "Git's core rebuilt in Python, using Git's real object format and checked against real Git.",
      fr: "Le cœur de Git réécrit en Python, avec le vrai format d'objets de Git et vérifié contre Git."
    },
    tech: ["Python", "Git", "pytest"],
    image: "images/pygit-demo.jpg",
    code: "https://github.com/Gothrick/pygit-ZO",
    live: "",
    repo: "Gothrick/pygit-ZO",
    updated: { en: "Fall 2026", fr: "Automne 2026" },
    details: {
      en: [
        "pygit ZO is a small implementation of Git in Python with no dependencies. It supports init, add, status, diff, commit, log, branch, and checkout, plus the low-level commands hash-object, cat-file, ls-files, and ls-tree.",
        "It stores blobs, trees, and commits in Git's real object format, so a repository made by pygit passes `git fsck --strict` and pygit can read commits written by real Git. Building it was a way to understand how Git works inside: content-addressed storage, the index, branches as small files, and how checkout rewrites the working folder."
      ],
      fr: [
        "pygit ZO est une petite implémentation de Git en Python, sans dépendance. Elle gère init, add, status, diff, commit, log, branch et checkout, ainsi que les commandes de bas niveau hash-object, cat-file, ls-files et ls-tree.",
        "Elle stocke les blobs, les arbres et les commits dans le vrai format d'objets de Git : un dépôt créé par pygit passe `git fsck --strict`, et pygit peut lire des commits écrits par Git. Ce projet sert à comprendre le fonctionnement interne de Git : stockage par contenu, index, branches sous forme de petits fichiers et réécriture du dossier de travail par checkout."
      ]
    },
    highlights: {
      en: [
        "Same on-disk format as Git: real `git fsck`, `git log`, and `git ls-tree` work on pygit repositories",
        "Safe checkout that refuses to overwrite uncommitted work, with file-to-folder changes handled",
        "195 automated tests, including tests that run the real git program and the CLI as a separate process"
      ],
      fr: [
        "Même format sur disque que Git : `git fsck`, `git log` et `git ls-tree` fonctionnent sur les dépôts pygit",
        "Checkout sécuritaire qui refuse d'écraser du travail non enregistré, avec gestion des changements fichier/dossier",
        "195 tests automatisés, dont des tests qui exécutent le vrai programme git et la ligne de commande comme processus séparé"
      ]
    },
    images: [
      "images/pygit-demo.jpg",
      "images/pygit-full-session.jpg"
    ]
  }
];

const SKILLS = ["PHP", "JavaScript", "Python", "Java", "C#", "C++", "SQL", "React", "Laravel", "ASP.NET", "Electron", "GraphQL", "Docker", "MySQL", "Git", "Linux", "Active Directory", "Agile (Scrum)"];
