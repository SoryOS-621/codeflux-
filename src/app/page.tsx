/**
 * @file page.tsx  (Home page — route: `/`)
 * @description Premium landing page for CodeFlux — a next-gen vibe coding platform.
 *
 * Layout:
 *   - Hero with animated gradient headline + prompt textarea
 *   - Template grid
 *   - Feature showcase (3 pillars)
 *   - Recent projects bar
 *   - Minimal footer
 *
 * All existing tRPC + mutation logic preserved.
 */

"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { StatusBadge } from "@/components/shared/status-badge";
import { RelativeTime } from "@/components/shared/relative-time";
import { useTypingPlaceholder } from "@/components/shared/typing-placeholder";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Code2,
  Eye,
  LayoutDashboard,
  Brain,
  Terminal,
  Globe,
  ChevronRight,
  Github,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";

// ─── Animation variants ──────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ─── Feature cards data ──────────────────────────────────────────────
const features = [
  {
    icon: Brain,
    title: "Multi-Agent AI",
    description:
      "Planner, Developer, Builder & Debugger agents collaborate to ship production code.",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: Code2,
    title: "Real-time Code",
    description:
      "Watch code being generated live with Monaco editor, syntax highlighting, and instant diffs.",
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: Eye,
    title: "Live Preview",
    description:
      "Cloud sandboxes power instant previews — see your app running as it's being built.",
    gradient: "from-violet-500/20 to-purple-500/20",
    iconColor: "text-violet-400",
  },
  {
    icon: Terminal,
    title: "Build Pipeline",
    description:
      "Integrated build logs, terminal output, and error diagnostics — all in one workspace.",
    gradient: "from-orange-500/20 to-amber-500/20",
    iconColor: "text-orange-400",
  },
  {
    icon: Zap,
    title: "Auto-Debug",
    description:
      "Automatic error detection and fix cycles — your code ships working, every time.",
    gradient: "from-rose-500/20 to-pink-500/20",
    iconColor: "text-rose-400",
  },
  {
    icon: Globe,
    title: "Deploy Anywhere",
    description:
      "One-click deploy to production. Preview URLs, custom domains, and instant sharing.",
    gradient: "from-sky-500/20 to-indigo-500/20",
    iconColor: "text-sky-400",
  },
];

const HomePage = () => {
  const router = useRouter();
  const trpc = useTRPC();

  const [promptText, setPromptText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const typingPlaceholder = useTypingPlaceholder();

  const templatesQuery = useQuery(trpc.templates.getAll.queryOptions());
  const projectsQuery = useQuery(trpc.projects.getMany.queryOptions());

  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: (data) => router.push(`/projects/${data.id}`),
    }),
  );

  const handleCreateProject = () => {
    const prompt =
      promptText ||
      (selectedTemplate
        ? `Build a ${templatesQuery.data?.find((t) => t.id === selectedTemplate)?.name ?? "website"}`
        : "");

    if (!prompt) {
      toast.error("Please enter a description or select a template.");
      return;
    }

    createProject.mutate({
      prompt,
      ...(selectedTemplate ? { templateId: selectedTemplate } : {}),
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    if (selectedTemplate === templateId) {
      setSelectedTemplate(null);
    } else {
      setSelectedTemplate(templateId);
      const template = templatesQuery.data?.find((t) => t.id === templateId);
      if (template && !promptText) {
        setPromptText(`Build a ${template.name.toLowerCase()}`);
      }
    }
  };

  const recentProjects = projectsQuery.data?.slice(0, 4) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[20%] h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[120px]" />
      </div>

      {/* ─── Nav ─── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <Logo showText />
          <nav className="flex items-center gap-1">
            {recentProjects.length > 0 && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
              </Button>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <main className="flex-1 relative z-10">
        <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 sm:pt-28 sm:pb-20">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center gap-6"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} custom={0}>
              <Badge
                variant="secondary"
                className="gap-1.5 px-3 py-1 text-xs font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
              >
                <Sparkles className="h-3 w-3" />
                AI-Powered Vibe Coding Platform
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
            >
              Describe it.{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-violet-400 bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_200%]">
                Ship it.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed"
            >
              CodeFlux turns your ideas into production-ready apps. Multi-agent AI handles
              planning, coding, building, and debugging — you just describe what you want.
            </motion.p>

            {/* ─── Prompt Input ─── */}
            <motion.div variants={fadeUp} custom={3} className="w-full max-w-2xl mt-4">
              <div className="relative group">
                {/* Glow ring */}
                <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/30 via-violet-500/30 to-primary/30 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />

                <div className="relative bg-card border rounded-xl shadow-lg overflow-hidden">
                  <Textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder={promptText ? undefined : typingPlaceholder || "Describe what you want to build..."}
                    className="min-h-[120px] resize-none border-0 bg-transparent text-base p-4 pb-14 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !createProject.isPending) {
                        e.preventDefault();
                        handleCreateProject();
                      }
                    }}
                  />
                  {/* Bottom bar */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2.5 bg-card/80 backdrop-blur-sm border-t border-border/50">
                    <span className="text-[11px] text-muted-foreground/60">
                      Enter to submit · Shift+Enter for new line
                    </span>
                    <Button
                      disabled={createProject.isPending}
                      onClick={handleCreateProject}
                      size="sm"
                      className="gap-1.5 shadow-md hover:shadow-lg transition-shadow"
                    >
                      {createProject.isPending ? (
                        "Creating..."
                      ) : (
                        <>
                          Start Building
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ─── Templates ─── */}
        {templatesQuery.data && templatesQuery.data.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium shrink-0">
                  Start from a template
                </span>
                <Separator className="flex-1" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {templatesQuery.data.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-lg group border-border/50",
                      selectedTemplate === template.id
                        ? "ring-2 ring-primary border-primary shadow-primary/10 shadow-lg"
                        : "hover:border-foreground/15 hover:bg-card/80",
                    )}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between">
                        <span className="text-2xl">{template.icon}</span>
                        {selectedTemplate === template.id ? (
                          <Badge variant="default" className="text-[10px] px-1.5">
                            Selected
                          </Badge>
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      <CardTitle className="text-sm mt-2">
                        {template.name}
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-2 leading-relaxed">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </motion.div>
          </section>
        )}

        {/* ─── Features ─── */}
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Everything you need to build
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
                A complete AI development environment that handles the entire lifecycle — from idea to deployed app.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                >
                  <Card className="border-border/50 bg-card/50 hover:bg-card/80 transition-colors h-full">
                    <CardHeader className="p-5">
                      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center bg-gradient-to-br mb-2", feature.gradient)}>
                        <feature.icon className={cn("h-4.5 w-4.5", feature.iconColor)} />
                      </div>
                      <CardTitle className="text-sm">{feature.title}</CardTitle>
                      <CardDescription className="text-xs leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ─── Recent Projects ─── */}
        {recentProjects.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Recent Projects
                </h2>
                <Button variant="link" size="sm" className="text-xs gap-1" asChild>
                  <Link href="/dashboard">
                    View all
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/40 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Code2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        <RelativeTime date={project.updatedAt} />
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </Link>
                ))}
              </div>
            </motion.div>
          </section>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo showText={false} />
            <span className="text-xs text-muted-foreground">
              Built with Next.js, TypeScript & AI
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;