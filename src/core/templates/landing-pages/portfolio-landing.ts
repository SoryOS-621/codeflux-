/**
 * @file core/templates/landing-pages/portfolio-landing.ts
 * @description Personal Portfolio Landing Page template — a clean, minimal
 * portfolio with hero, about, projects showcase, skills, contact, and footer.
 */

import type { ProjectTemplate } from "../types";

// ---------------------------------------------------------------------------
// Template File Contents
// ---------------------------------------------------------------------------

const PAGE_TSX = `"use client";

import { Navbar } from "./components/navbar";
import { HeroSection } from "./components/hero-section";
import { AboutSection } from "./components/about-section";
import { ProjectsSection } from "./components/projects-section";
import { SkillsSection } from "./components/skills-section";
import { ContactSection } from "./components/contact-section";
import { Footer } from "./components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
`;

const NAVBAR_TSX = `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Code2 } from "lucide-react";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <a href="#" className="flex items-center gap-2 font-bold text-xl">
          <Code2 className="h-6 w-6 text-primary" />
          <span>Portfolio</span>
        </a>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button size="sm">Hire Me</Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <div className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-lg font-medium"
                >
                  {link.label}
                </a>
              ))}
              <Button className="mt-4">Hire Me</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
`;

const HERO_SECTION_TSX = `import { Button } from "@/components/ui/button";
import { ArrowDown, Github, Linkedin, Twitter } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Avatar placeholder */}
          <div className="mx-auto mb-8 h-28 w-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-4xl border-4 border-background shadow-lg">
            👨‍💻
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Hi, I&apos;m{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Alex Morgan
            </span>
          </h1>

          <p className="mt-6 text-xl text-muted-foreground">
            Full-Stack Developer &amp; UI/UX Designer.
            I craft beautiful, performant digital experiences.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg">View My Work</Button>
            <Button variant="outline" size="lg">
              Download CV
              <ArrowDown className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Social links */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button variant="ghost" size="icon">
              <Github className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Linkedin className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Twitter className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
`;

const ABOUT_SECTION_TSX = `import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, GraduationCap, MapPin } from "lucide-react";

const stats = [
  { label: "Years Experience", value: "5+" },
  { label: "Projects Completed", value: "40+" },
  { label: "Happy Clients", value: "25+" },
  { label: "Awards", value: "8" },
];

export function AboutSection() {
  return (
    <section id="about" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-center mb-12">
            About Me
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Bio */}
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                I&apos;m a passionate developer with over 5 years of experience building
                web applications and digital products. I specialize in React, Next.js,
                and TypeScript.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                When I&apos;m not coding, you can find me contributing to open-source projects,
                writing technical blog posts, or exploring new technologies.
              </p>

              <div className="flex flex-col gap-2 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">San Francisco, CA</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Available for freelance</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">B.S. Computer Science</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="text-center">
                  <CardContent className="pt-6">
                    <p className="text-3xl font-bold text-primary">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
`;

const PROJECTS_SECTION_TSX = `import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github } from "lucide-react";

const projects = [
  {
    title: "E-Commerce Platform",
    description: "A full-featured online store with cart, checkout, and payment integration. Built with Next.js and Stripe.",
    tags: ["Next.js", "TypeScript", "Stripe", "Tailwind"],
    color: "bg-blue-500/10",
    emoji: "🛒",
  },
  {
    title: "Task Management App",
    description: "A Trello-style task board with drag-and-drop, real-time updates, and team collaboration features.",
    tags: ["React", "Firebase", "DnD Kit", "Tailwind"],
    color: "bg-green-500/10",
    emoji: "📋",
  },
  {
    title: "AI Chat Interface",
    description: "A modern chat application with AI-powered responses, conversation history, and markdown support.",
    tags: ["Next.js", "OpenAI", "Prisma", "TypeScript"],
    color: "bg-purple-500/10",
    emoji: "🤖",
  },
  {
    title: "Analytics Dashboard",
    description: "A real-time analytics dashboard with interactive charts, KPI tracking, and data visualization.",
    tags: ["React", "D3.js", "Node.js", "PostgreSQL"],
    color: "bg-orange-500/10",
    emoji: "📊",
  },
];

export function ProjectsSection() {
  return (
    <section id="projects" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Featured Projects
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            A selection of my recent work. Each project reflects my commitment
            to quality, performance, and user experience.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
          {projects.map((project) => (
            <Card key={project.title} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Project image placeholder */}
              <div className={\`\${project.color} aspect-video flex items-center justify-center text-5xl\`}>
                {project.emoji}
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{project.title}</CardTitle>
                <CardDescription className="text-base">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline" size="sm">
                  <Github className="mr-1.5 h-4 w-4" />
                  Code
                </Button>
                <Button size="sm">
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  Live Demo
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
`;

const SKILLS_SECTION_TSX = `import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const skillCategories = [
  {
    title: "Frontend",
    skills: [
      { name: "React / Next.js", level: 95 },
      { name: "TypeScript", level: 90 },
      { name: "Tailwind CSS", level: 92 },
      { name: "HTML / CSS", level: 95 },
    ],
  },
  {
    title: "Backend",
    skills: [
      { name: "Node.js", level: 88 },
      { name: "Python", level: 80 },
      { name: "PostgreSQL", level: 85 },
      { name: "REST / GraphQL", level: 87 },
    ],
  },
  {
    title: "Tools & DevOps",
    skills: [
      { name: "Git / GitHub", level: 92 },
      { name: "Docker", level: 78 },
      { name: "CI/CD", level: 82 },
      { name: "AWS / Vercel", level: 85 },
    ],
  },
  {
    title: "Design",
    skills: [
      { name: "Figma", level: 85 },
      { name: "UI/UX Design", level: 80 },
      { name: "Responsive Design", level: 92 },
      { name: "Accessibility", level: 88 },
    ],
  },
];

export function SkillsSection() {
  return (
    <section id="skills" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Skills & Expertise
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Technologies and tools I work with on a daily basis.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
          {skillCategories.map((category) => (
            <Card key={category.title}>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">{category.title}</h3>
                <div className="space-y-4">
                  {category.skills.map((skill) => (
                    <div key={skill.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{skill.name}</span>
                        <span className="text-muted-foreground">{skill.level}%</span>
                      </div>
                      <Progress value={skill.level} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
`;

const CONTACT_SECTION_TSX = `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Send } from "lucide-react";

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic
    alert("Thanks for reaching out! I'll get back to you soon.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Get In Touch
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Have a project in mind? Let&apos;s talk about how I can help bring your ideas to life.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Contact info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">alex@example.com</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Availability</p>
                  <p className="text-sm text-muted-foreground">Open to freelance &amp; full-time</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact form */}
          <Card>
            <CardHeader>
              <CardTitle>Send a Message</CardTitle>
              <CardDescription>
                Fill out the form and I&apos;ll get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell me about your project..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
`;

const FOOTER_TSX = `import { Separator } from "@/components/ui/separator";
import { Code2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Alex Morgan. Built with Next.js &amp; Tailwind CSS.
            </span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              LinkedIn
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
`;

// ---------------------------------------------------------------------------
// Template Definition
// ---------------------------------------------------------------------------

export const portfolioLandingTemplate: ProjectTemplate = {
  id: "landing-portfolio",
  name: "Portfolio Landing Page",
  description: "Clean personal portfolio with about, projects showcase, skills, and contact form.",
  icon: "👨‍💻",
  category: "landing-page",
  tags: ["portfolio", "personal", "developer", "freelancer", "resume"],

  files: {
    "app/page.tsx": PAGE_TSX,
    "app/components/navbar.tsx": NAVBAR_TSX,
    "app/components/hero-section.tsx": HERO_SECTION_TSX,
    "app/components/about-section.tsx": ABOUT_SECTION_TSX,
    "app/components/projects-section.tsx": PROJECTS_SECTION_TSX,
    "app/components/skills-section.tsx": SKILLS_SECTION_TSX,
    "app/components/contact-section.tsx": CONTACT_SECTION_TSX,
    "app/components/footer.tsx": FOOTER_TSX,
  },

  plan: {
    description: "A personal portfolio landing page with hero, about section, project showcase, skills progress bars, contact form, and footer.",
    steps: [
      "Write pre-built template files to the sandbox",
      "Customize personal details, projects, and skills based on user prompt",
      "Ensure responsive design and accessibility",
    ],
    filesToCreate: [
      "app/page.tsx",
      "app/components/navbar.tsx",
      "app/components/hero-section.tsx",
      "app/components/about-section.tsx",
      "app/components/projects-section.tsx",
      "app/components/skills-section.tsx",
      "app/components/contact-section.tsx",
      "app/components/footer.tsx",
    ],
    dependenciesToInstall: [],
  },

  customizationPrompt: `A complete personal portfolio template has already been written to the sandbox with the following files:
- app/page.tsx (main page composing all sections)
- app/components/navbar.tsx (responsive nav with mobile menu)
- app/components/hero-section.tsx (hero with name, title, social links)
- app/components/about-section.tsx (bio, stats, location)
- app/components/projects-section.tsx (4-project showcase grid)
- app/components/skills-section.tsx (skill bars in 4 categories)
- app/components/contact-section.tsx (contact form + info cards)
- app/components/footer.tsx (simple footer with links)

The template is ALREADY FUNCTIONAL. Your job is to CUSTOMIZE it based on the user's specific request.
Typical customizations:
- Change the person's name, title, bio, and location
- Update project titles, descriptions, and tech stacks
- Modify skill categories and proficiency levels
- Update contact information and availability
- Adjust the color scheme or section order
- Add or remove sections as requested

IMPORTANT: Be FAST. Complete all changes in 3–5 tool calls total. Do NOT explore files one-by-one — read multiple files at once, then write all changes at once using createOrUpdateFiles with multiple files in a single call. Finish quickly.

DO NOT rebuild from scratch — modify the existing files. Read them first with readFiles if needed, then update using createOrUpdateFiles.`,
};
