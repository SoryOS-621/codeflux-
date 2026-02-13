# CodeFlux

**An AI-powered code generation platform** that lets you describe what you want to build in plain English, and an AI agent writes the full code for you inside a live cloud sandbox — you can see it running in real-time.

> Think of it as: *"Describe a website → AI builds it → Preview it instantly."*

---

## 📋 Table of Contents

- [What Does CodeFlux Do?](#what-does-codeflux-do)
- [How It Works (The Big Picture)](#how-it-works-the-big-picture)
- [Tech Stack](#tech-stack)
- [Project Structure (Explained)](#project-structure-explained)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Prerequisites](#prerequisites)
- [Installation (Step by Step)](#installation-step-by-step)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Architecture Deep Dive](#architecture-deep-dive)
- [OpenRouter & AI Models](#openrouter--ai-models)
- [E2B Sandbox](#e2b-sandbox)
- [Scripts](#scripts)
- [Contributing](#contributing)

---

## 🤔 What Does CodeFlux Do?

1. **You type a prompt** — e.g. *"Build me a todo app with dark mode"*
2. **An AI agent gets to work** — it plans, writes code, installs packages, and creates files
3. **Everything happens in a cloud sandbox** — a real Next.js dev server running in the cloud (via [E2B](https://e2b.dev))
4. **You see the result** — a live preview URL of the app the AI just built

**In simple terms:** You describe → AI codes → You preview. No setup, no boilerplate.

---

## 🔄 How It Works (The Big Picture)

Here's the flow from the moment you type a prompt to seeing a result:

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR BROWSER                             │
│                                                                 │
│  1. You type: "Build a weather dashboard"                       │
│  2. Click "Start Creating"                                      │
│                                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS SERVER (tRPC)                       │
│                                                                 │
│  3. Creates a new Project in PostgreSQL                         │
│  4. Saves your prompt as a Message                              │
│  5. Fires an event to Inngest: "app/developerEvent"             │
│                                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     INNGEST (Background Jobs)                   │
│                                                                 │
│  6. Spins up a cloud sandbox (E2B) with Next.js pre-installed   │
│  7. Creates an AI agent (via OpenRouter free models)             │
│  8. The agent loops up to 30 times, using tools:                │
│       • terminal  → run shell commands (npm install, ls, etc.)  │
│       • createOrUpdateFiles → write code files                  │
│       • readFiles → read existing files                         │
│  9. Agent writes a <task_summary> when done                     │
│                                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL + Prisma)                 │
│                                                                 │
│  10. Saves the AI's response as a Message                       │
│  11. Saves the generated code as a Fragment                     │
│       (contains: sandbox URL, file contents, title)             │
│                                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LIVE PREVIEW                                │
│                                                                 │
│  12. You get a URL to the running sandbox                       │
│  13. The app the AI built is live and interactive!              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Tech Stack

| Layer | Technology | What It Does |
|-------|-----------|-------------|
| **Frontend** | Next.js 15 + React 19 | The web UI you interact with |
| **Styling** | Tailwind CSS + Shadcn/UI (Radix) | Beautiful, accessible components |
| **API Layer** | tRPC | Type-safe communication between frontend and backend (no REST needed) |
| **Database** | PostgreSQL + Prisma ORM | Stores projects, messages, and generated code |
| **Background Jobs** | Inngest | Runs the AI agent in the background (so the UI doesn't freeze) |
| **AI** | OpenRouter (free models) | The brain — generates code based on your prompts |
| **Cloud Sandbox** | E2B | A real Next.js environment in the cloud where the AI writes and runs code |
| **Language** | TypeScript | Everything is type-safe, from database to UI |

---

## 📁 Project Structure (Explained)

Every folder and file has a purpose. Here's what each one does:

```
codeflux/
│
├── prisma/                          # 🗄️ DATABASE
│   ├── schema.prisma               #    Defines tables: Project, Message, Fragment
│   ├── seed.ts                     #    Script to populate the DB with sample data
│   └── migrations/                 #    Auto-generated SQL migration history
│
├── sandbox-templates/               # 📦 E2B SANDBOX TEMPLATE
│   └── nextjs/
│       ├── e2b.Dockerfile          #    Docker image for the cloud sandbox
│       ├── e2b.toml                #    Sandbox config (template name/ID)
│       └── compile_page.sh         #    Starts the Next.js dev server inside the sandbox
│
├── src/
│   ├── prompt.ts                   # 🧠 THE AI'S SYSTEM PROMPT
│   │                               #    Tells the AI how to behave, what tools it has,
│   │                               #    what rules to follow (e.g. use Tailwind, no CSS files)
│   │
│   ├── app/                        # 📄 PAGES (Next.js App Router)
│   │   ├── layout.tsx              #    Root layout — wraps everything, loads fonts & tRPC
│   │   ├── page.tsx                #    Home page — input box + "Start Creating" button
│   │   ├── globals.css             #    Global Tailwind styles
│   │   ├── projects/
│   │   │   └── [projectId]/
│   │   │       └── page.tsx        #    Project detail page — shows results for a project
│   │   └── api/
│   │       ├── trpc/
│   │       │   └── [trpc]/         #    tRPC HTTP handler — all API requests go through here
│   │       └── inngest/
│   │           └── route.ts        #    Inngest webhook — receives background job events
│   │
│   ├── modules/                    # 📦 FEATURE MODULES (business logic)
│   │   ├── projects/
│   │   │   └── server/
│   │   │       └── procedures.ts   #    API: create project, list projects
│   │   └── messages/
│   │       └── server/
│   │           └── procedures.ts   #    API: create message, list messages
│   │
│   ├── inngest/                    # ⚡ BACKGROUND AI AGENT
│   │   ├── client.ts              #    Inngest client setup
│   │   ├── functions.ts           #    THE MAIN AI AGENT — creates sandbox, runs AI loop
│   │   └── utils.ts               #    Helpers: connect to sandbox, parse AI messages
│   │
│   ├── trpc/                       # 🔌 API LAYER SETUP
│   │   ├── init.ts                #    Creates tRPC instance with SuperJSON
│   │   ├── client.tsx             #    Client-side tRPC provider (React context)
│   │   ├── server.tsx             #    Server-side tRPC caller
│   │   ├── query-client.ts        #    TanStack Query configuration
│   │   └── routers/
│   │       └── _app.ts            #    Main router — combines all module routers
│   │
│   ├── components/
│   │   └── ui/                    # 🎨 40+ SHADCN/UI COMPONENTS
│   │       ├── button.tsx         #    Buttons, cards, dialogs, forms, tables, etc.
│   │       ├── card.tsx           #    All pre-built, accessible, and customizable
│   │       └── ...                #    (See components.json for Shadcn config)
│   │
│   ├── generated/
│   │   └── client/                # 🤖 AUTO-GENERATED PRISMA CLIENT
│   │                              #    Don't edit these — they're generated from schema.prisma
│   │
│   ├── hooks/
│   │   └── use-mobile.ts         # 📱 Custom hook to detect mobile screens
│   │
│   └── lib/
│       ├── prisma.ts             # 🗄️ Prisma client singleton
│       └── utils.ts              # 🔧 Utility: cn() for merging Tailwind classes
│
├── utils/
│   └── trpc.ts                   # tRPC utility exports
│
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript config
├── next.config.ts                 # Next.js config
├── prisma.config.ts               # Prisma config
├── eslint.config.mjs              # ESLint rules
├── postcss.config.mjs             # PostCSS (used by Tailwind)
├── components.json                # Shadcn/UI configuration
└── OPENROUTER_SETUP.md            # Guide for setting up AI models
```

---

## 🗄️ Database Schema

The app uses **3 tables** in PostgreSQL, managed by Prisma:

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Project    │       │   Message    │       │   Fragment   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (uuid)    │◄──┐   │ id (uuid)    │◄──┐   │ id (uuid)    │
│ name         │   │   │ content      │   │   │ messageId    │──► Message
│ createdAt    │   └───│ projectId    │   └───│ sandboxUrl   │
│ updatedAt    │       │ role (enum)  │       │ title        │
└──────────────┘       │ type (enum)  │       │ files (json) │
                       │ createdAt    │       │ createdAt    │
                       │ updatedAt    │       │ updatedAt    │
                       └──────────────┘       └──────────────┘
```

| Table | Purpose |
|-------|---------|
| **Project** | A workspace — each prompt you submit creates a new project |
| **Message** | Chat history — your prompts (`USER`) and AI responses (`ASSISTANT`) |
| **Fragment** | The generated code — stores the sandbox URL and all file contents as JSON |

**Enums:**
- `MessageRole`: `USER` or `ASSISTANT`
- `MessageType`: `RESULT` (success) or `ERROR` (something went wrong)

---

## 🔌 API Endpoints

All APIs are type-safe via **tRPC** (no REST URLs to memorize). Here's what's available:

### Projects Router (`trpc.projects.*`)

| Endpoint | Type | What It Does |
|----------|------|-------------|
| `projects.getMany` | Query | Get all projects, newest first |
| `projects.create` | Mutation | Create a project from a prompt. Saves the prompt as a message, then fires the AI agent via Inngest |

### Messages Router (`trpc.messages.*`)

| Endpoint | Type | What It Does |
|----------|------|-------------|
| `messages.getMany` | Query | Get all messages, newest first |
| `messages.create` | Mutation | Send a follow-up message to a project, triggers the AI agent again |

---

## 📋 Prerequisites

Before you start, make sure you have:

| Requirement | Why You Need It |
|-------------|----------------|
| **Node.js** v18+ | Runs the app |
| **PostgreSQL** v13+ | Stores your data |
| **OpenRouter API Key** | Gives the AI agent a brain (free tier available) |
| **E2B API Key** | Creates cloud sandboxes where the AI writes code |
| **Inngest Dev Server** | Runs background jobs locally |

---

## 🔧 Installation (Step by Step)

### 1. Clone the repo

```bash
git clone <repository-url>
cd codeflux
```

### 2. Install dependencies

```bash
npm install
```

### 3. Generate the Prisma client

```bash
npx prisma generate
```

### 4. Set up your database

```bash
npx prisma migrate dev
```

This creates the `Project`, `Message`, and `Fragment` tables in your PostgreSQL database.

---

## 🌍 Environment Variables

Create a `.env` file in the root directory with these values:

```env
# === DATABASE ===
# Your PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/codeflux"

# === AI (OpenRouter) ===
# Get a free key at: https://openrouter.ai/keys
OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxxxxxx"

# === CLOUD SANDBOX (E2B) ===
# Get a key at: https://e2b.dev
E2B_API_KEY="e2b_xxxxxxxxxxxxx"

# === APP URL ===
# Used by tRPC for server-side requests
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Where to get each key:

| Variable | Where to Get It | Cost |
|----------|----------------|------|
| `DATABASE_URL` | Install PostgreSQL locally, or use [Neon](https://neon.tech) / [Supabase](https://supabase.com) | Free tier available |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) | Free models available |
| `E2B_API_KEY` | [e2b.dev](https://e2b.dev) | Free tier available |

---

## 🚀 Running the App

You need **two terminals** running at the same time:

### Terminal 1 — Next.js dev server

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000)

### Terminal 2 — Inngest dev server

```bash
npx inngest-cli@latest dev
```

Opens the Inngest dashboard at [http://localhost:8288](http://localhost:8288) — you can see background jobs running here.

### What happens when you use the app:

1. Go to `http://localhost:3000`
2. Type a description like *"Build a habit tracker app"*
3. Click **"Start Creating"**
4. A project is created, the AI agent starts working in the background
5. Check the Inngest dashboard to watch the agent's progress
6. When done, a live preview URL appears with your generated app

---

## 🏗️ Architecture Deep Dive

### The AI Agent (the core of CodeFlux)

The agent lives in `src/inngest/functions.ts`. Here's what it does step by step:

```
1. Creates an E2B sandbox (a cloud VM with Next.js pre-installed)
2. Creates an AI agent with 3 tools:
   ├── terminal      → Run shell commands (npm install, ls, etc.)
   ├── createOrUpdateFiles → Write/edit code files
   └── readFiles     → Read existing files
3. Runs the agent in a loop (up to 30 iterations)
4. Agent reads the project structure, plans, writes code, installs packages
5. When done, agent outputs a <task_summary>
6. Result is saved to the database (Message + Fragment)
7. Sandbox URL is returned for live preview
```

### How tRPC works in this project

tRPC gives you **type-safe API calls** without writing REST endpoints:

```
Frontend (React)                    Backend (Server)
─────────────────                   ────────────────
trpc.projects.create.mutate(...)  → projectsRouter.create → Prisma → DB
trpc.messages.getMany.useQuery()  → messagesRouter.getMany → Prisma → DB
```

No `fetch()`, no URL strings, no manual types. Everything is auto-completed by TypeScript.

### How Inngest works in this project

Inngest handles **background jobs** so the UI doesn't freeze while the AI works:

```
User clicks "Start Creating"
  → tRPC mutation saves to DB
  → inngest.send({ name: "app/developerEvent", data: {...} })
  → Inngest picks it up and runs the `developer` function
  → AI agent works for 30–120 seconds
  → Result saved to DB
```

The Inngest endpoint lives at `/api/inngest/route.ts`.

---

## 🤖 OpenRouter & AI Models

CodeFlux uses **OpenRouter** to access AI models (including free ones). The current model is:

```
openai/gpt-oss-120b:free
```

You can switch to any model listed in [OPENROUTER_SETUP.md](OPENROUTER_SETUP.md). To change the model, edit the `model` field in `src/inngest/functions.ts`:

```typescript
model: openai({
  model: "google/gemma-2-9b-it:free",  // ← Change this
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseUrl: "https://openrouter.ai/api/v1",
}),
```

---

## 📦 E2B Sandbox

The sandbox is a **real cloud environment** where the AI writes and executes code. It comes pre-configured with:

- Node.js 21
- Next.js 15.3.3
- All Shadcn/UI components
- Tailwind CSS
- A running dev server on port 3000

The sandbox template is defined in `sandbox-templates/nextjs/`. The AI can read, write, and run commands inside it — like a remote VS Code terminal.

---

## 📜 Scripts

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start Next.js with Turbopack (fast HMR) |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Check code for issues |
| `npx prisma generate` | Regenerate the Prisma client after schema changes |
| `npx prisma migrate dev` | Apply database migrations |
| `npx prisma studio` | Open a visual database browser at `localhost:5555` |
| `npx inngest-cli@latest dev` | Start the Inngest background job server |

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Commit: `git commit -m "Add my feature"`
5. Push: `git push origin feature/my-feature`
6. Open a Pull Request

---

## 🔗 Resources

| Resource | Link |
|----------|------|
| Next.js | [nextjs.org/docs](https://nextjs.org/docs) |
| tRPC | [trpc.io/docs](https://trpc.io/docs) |
| Prisma | [prisma.io/docs](https://www.prisma.io/docs) |
| Inngest | [inngest.com/docs](https://www.inngest.com/docs) |
| E2B | [e2b.dev/docs](https://e2b.dev/docs) |
| OpenRouter | [openrouter.ai/docs](https://openrouter.ai/docs) |
| Shadcn/UI | [ui.shadcn.com](https://ui.shadcn.com) |
| Tailwind CSS | [tailwindcss.com/docs](https://tailwindcss.com/docs) |

---

**Built with Next.js, tRPC, Prisma, Inngest, E2B, and OpenRouter**
