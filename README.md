# CodeFlux

A modern, full-stack web application built with Next.js 15, tRPC, Prisma, and PostgreSQL. This project features a type-safe API layer, server-side rendering, and a comprehensive UI component library built with Radix UI and Tailwind CSS.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Development Guide](#development-guide)
- [API Documentation](#api-documentation)
- [UI Components](#ui-components)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🌟 Overview

CodeFlux is a production-ready Next.js application that demonstrates modern web development practices. It combines the power of server-side rendering with a fully type-safe API layer using tRPC, ensuring end-to-end type safety from database to frontend.

## 🚀 Tech Stack

### Core Framework
- **Next.js 15.5.7** - React framework with App Router
- **React 19** - UI library with Server Components
- **TypeScript 5** - Type-safe JavaScript

### Backend & API
- **tRPC 11.9.0** - End-to-end type-safe APIs
- **Prisma 7.3.0** - Next-generation ORM
- **PostgreSQL** - Primary database
- **Zod 4.3.6** - Schema validation
- **SuperJSON 2.2.6** - JSON serialization

### UI & Styling
- **Tailwind CSS 4.1.18** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible components
- **Lucide React** - Icon library
- **next-themes** - Dark mode support
- **Recharts** - Chart library
- **Sonner** - Toast notifications

### State Management & Data Fetching
- **TanStack Query 5.90.20** - Powerful data synchronization
- **React Hook Form 7.68.0** - Form management

### Development Tools
- **Turbopack** - Fast bundler
- **ESLint** - Code linting
- **tsx** - TypeScript executor

## 📁 Project Structure

```
codeflux/
├── prisma/                      # Database configuration
│   ├── schema.prisma           # Prisma schema definition
│   └── seed.ts                 # Database seeding script
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/
│   │   │   └── trpc/          # tRPC API endpoints
│   │   │       └── [trpc]/
│   │   │           └── route.ts
│   │   ├── client.tsx         # Client component
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   │
│   ├── components/
│   │   └── ui/                # Reusable UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── form.tsx
│   │       └── ... (40+ components)
│   │
│   ├── generated/
│   │   └── client/            # Prisma generated client
│   │
│   ├── hooks/                 # Custom React hooks
│   │   └── use-mobile.ts
│   │
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   │
│   └── trpc/                  # tRPC configuration
│       ├── client.tsx         # Client-side tRPC setup
│       ├── server.tsx         # Server-side tRPC setup
│       ├── init.ts            # tRPC initialization
│       ├── query-client.ts    # TanStack Query config
│       └── routers/
│           └── _app.ts        # Main tRPC router
│
├── lib/
│   └── prisma.ts              # Prisma client singleton
│
├── components.json             # shadcn/ui configuration
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## ✨ Features

### Current Implementation
- ✅ **Full-stack Type Safety** - End-to-end type safety with tRPC
- ✅ **Server-Side Rendering** - Optimized SSR with Next.js 15
- ✅ **Database Integration** - PostgreSQL with Prisma ORM
- ✅ **UI Component Library** - 40+ accessible Radix UI components
- ✅ **Dark Mode Support** - Theme switching with next-themes
- ✅ **Form Management** - React Hook Form with Zod validation
- ✅ **Data Prefetching** - Optimized with TanStack Query
- ✅ **Responsive Design** - Mobile-first approach

### Database Models
- **User Model**: User management with email and name
- **Post Model**: Content creation with author relationships

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm**, **yarn**, **pnpm**, or **bun**
- **PostgreSQL** (v13 or higher)
- **Git**

## 🔧 Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd codeflux
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

## 🌍 Environment Setup

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/codeflux?schema=public"

# Optional: Prisma Adapter for PostgreSQL
# If using connection pooling (e.g., PgBouncer)
DATABASE_URL_UNPOOLED="postgresql://username:password@localhost:5432/codeflux?schema=public"
```

### Database URL Format
```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=[schema]
```

**Example:**
```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/codeflux?schema=public"
```

## 🗄️ Database Setup

### 1. Generate Prisma Client
```bash
npx prisma generate
```

This generates the type-safe Prisma Client in `src/generated/client/`.

### 2. Run Database Migrations
```bash
npx prisma migrate dev --name init
```

This creates the database tables based on your Prisma schema.

### 3. (Optional) Seed the Database
```bash
npx prisma db seed
```

### 4. Open Prisma Studio (Database GUI)
```bash
npx prisma studio
```

Access the database GUI at `http://localhost:5555`

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

The application will start at [http://localhost:3000](http://localhost:3000)

**Features in Development Mode:**
- Hot module replacement
- Fast refresh
- Turbopack bundler
- Real-time error overlay

### Production Build
```bash
npm run build
npm run start
```

### Linting
```bash
npm run lint
```

## 💻 Development Guide

### Adding a New tRPC Procedure

1. **Define the procedure in `src/trpc/routers/_app.ts`:**
```typescript
export const appRouter = createTRPCRouter({
  // Existing procedures...
  
  getUserById: baseProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.id },
      });
      return user;
    }),
});
```

2. **Use it in your components:**
```typescript
// Server Component
const user = await trpc.getUserById({ id: 1 });

// Client Component
const { data: user } = trpc.getUserById.useQuery({ id: 1 });
```

### Creating a New Database Model

1. **Update `prisma/schema.prisma`:**
```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  price       Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

2. **Generate and migrate:**
```bash
npx prisma migrate dev --name add_product_model
npx prisma generate
```

### Adding UI Components

This project uses a custom component library based on Radix UI and Tailwind CSS. All components are located in `src/components/ui/`.

**Example Usage:**
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello World</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

## 📚 API Documentation

### tRPC Router Structure

The main router is defined in `src/trpc/routers/_app.ts` and exported as `AppRouter` type.

#### Current Endpoints

**`hello` Query**
- **Type:** Query
- **Input:** `{ text: string }`
- **Output:** `{ greeting: string }`
- **Example:**
```typescript
const result = await trpc.hello.query({ text: "World" });
// Returns: { greeting: "hello World" }
```

### Client-Side Usage

```tsx
"use client";

import { trpc } from "@/trpc/client";

export function MyComponent() {
  const { data, isLoading, error } = trpc.hello.useQuery({ text: "World" });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{data.greeting}</div>;
}
```

### Server-Side Usage

```tsx
import { trpc } from "@/trpc/server";

export default async function Page() {
  const data = await trpc.hello({ text: "World" });
  return <div>{data.greeting}</div>;
}
```

## 🎨 UI Components

The project includes 40+ pre-built, accessible UI components:

### Layout Components
- `Card`, `Separator`, `Sidebar`, `ScrollArea`, `Resizable`

### Form Components
- `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `Slider`
- `Form`, `Field`, `Label`, `InputOTP`, `InputGroup`

### Feedback Components
- `Alert`, `AlertDialog`, `Dialog`, `Sheet`, `Drawer`, `Sonner`
- `Progress`, `Spinner`, `Skeleton`, `Toast`

### Navigation Components
- `Button`, `ButtonGroup`, `Tabs`, `Breadcrumb`, `Pagination`
- `NavigationMenu`, `Menubar`, `DropdownMenu`, `ContextMenu`

### Data Display
- `Table`, `Badge`, `Avatar`, `EmptyState`, `Tooltip`, `HoverCard`
- `Accordion`, `Collapsible`, `Chart`, `Calendar`

### Advanced Components
- `Command`, `Popover`, `Carousel`, `AspectRatio`, `Toggle`, `Kbd`

All components support:
- ✅ Dark mode
- ✅ Full accessibility (ARIA)
- ✅ Keyboard navigation
- ✅ Custom styling via className
- ✅ TypeScript types

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma migrate dev` | Create and apply migrations |
| `npx prisma studio` | Open Prisma Studio GUI |
| `npx prisma db push` | Push schema changes without migration |
| `npx prisma db seed` | Seed the database |

## 🚢 Deployment

### Vercel (Recommended)

1. **Push your code to GitHub**
2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Configure environment variables
   - Deploy

3. **Environment Variables:**
   - Add `DATABASE_URL` in Vercel dashboard
   - Consider using Vercel Postgres or external PostgreSQL service

### Other Platforms

This Next.js app can be deployed to:
- **Netlify**
- **Railway**
- **Render**
- **AWS Amplify**
- **Google Cloud Run**
- **Docker** (self-hosted)

### Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t codeflux .
docker run -p 3000:3000 -e DATABASE_URL="postgresql://..." codeflux
```

## 🔒 Best Practices

### Type Safety
- Always use TypeScript for new files
- Define Zod schemas for all inputs
- Use Prisma types for database operations

### Performance
- Use Server Components by default
- Add `"use client"` only when needed
- Implement data prefetching with TanStack Query
- Optimize images with `next/image`

### Database
- Always use migrations for schema changes
- Never modify the generated Prisma Client
- Use transactions for related operations
- Index frequently queried fields

### Security
- Validate all inputs with Zod
- Never expose sensitive data in client components
- Use environment variables for secrets
- Implement proper error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)

## 💬 Support

For issues, questions, or contributions, please open an issue in the GitHub repository.

---

**Built with ❤️ using Next.js, tRPC, and Prisma**
