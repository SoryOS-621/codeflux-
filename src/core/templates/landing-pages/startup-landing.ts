/**
 * @file core/templates/landing-pages/startup-landing.ts
 * @description Startup / Product Launch Landing Page template — bold design
 * with hero, problem/solution, how-it-works, social proof, FAQ, and waitlist CTA.
 */

import type { ProjectTemplate } from "../types";

// ---------------------------------------------------------------------------
// Template File Contents
// ---------------------------------------------------------------------------

const PAGE_TSX = `"use client";

import { Navbar } from "./components/navbar";
import { HeroSection } from "./components/hero-section";
import { ProblemSection } from "./components/problem-section";
import { SolutionSection } from "./components/solution-section";
import { HowItWorksSection } from "./components/how-it-works-section";
import { SocialProofSection } from "./components/social-proof-section";
import { FAQSection } from "./components/faq-section";
import { WaitlistSection } from "./components/waitlist-section";
import { Footer } from "./components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <SocialProofSection />
        <FAQSection />
        <WaitlistSection />
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
import { Menu, Rocket } from "lucide-react";

const navLinks = [
  { label: "Problem", href: "#problem" },
  { label: "Solution", href: "#solution" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <a href="#" className="flex items-center gap-2 font-bold text-xl">
          <Rocket className="h-6 w-6 text-primary" />
          <span>LaunchKit</span>
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
          <Button size="sm">Join Waitlist</Button>
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
              <Button className="mt-4">Join Waitlist</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
`;

const HERO_SECTION_TSX = `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(\`Thanks! We'll notify \${email} when we launch.\`);
      setEmail("");
    }
  };

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))]" />

      <div className="container mx-auto px-4 text-center">
        <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Launching Soon — Be First in Line
        </Badge>

        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          The future of{" "}
          <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            product development
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Stop wasting time on repetitive tasks. LaunchKit automates your workflow
          so you can focus on what matters — building great products.
        </p>

        {/* Email capture */}
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 flex max-w-md flex-col sm:flex-row gap-3"
        >
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" size="lg">
            Join Waitlist
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          🎉 1,200+ people already on the waitlist
        </p>
      </div>
    </section>
  );
}
`;

const PROBLEM_SECTION_TSX = `import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Clock, DollarSign } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Wasted Time",
    description: "Teams spend 40% of their time on manual, repetitive processes instead of building.",
    stat: "40%",
    statLabel: "time wasted",
  },
  {
    icon: DollarSign,
    title: "Rising Costs",
    description: "Bloated toolchains and inefficient workflows drain budgets without adding value.",
    stat: "$50K+",
    statLabel: "annual waste",
  },
  {
    icon: AlertTriangle,
    title: "Missed Deadlines",
    description: "Without proper automation, teams consistently miss launch targets and lose market share.",
    stat: "67%",
    statLabel: "projects delayed",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            The problem is clear
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Modern product teams are drowning in complexity.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {problems.map((problem) => (
            <Card key={problem.title} className="text-center border-destructive/20 bg-destructive/5">
              <CardContent className="pt-8 pb-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
                  <problem.icon className="h-7 w-7 text-destructive" />
                </div>
                <p className="text-4xl font-bold text-destructive mb-1">{problem.stat}</p>
                <p className="text-sm text-muted-foreground mb-4">{problem.statLabel}</p>
                <h3 className="text-lg font-semibold mb-2">{problem.title}</h3>
                <p className="text-sm text-muted-foreground">{problem.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
`;

const SOLUTION_SECTION_TSX = `import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Zap, BarChart3, Lock } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "10x Faster Shipping",
    description: "Automated CI/CD, instant previews, and one-click deployments.",
  },
  {
    icon: BarChart3,
    title: "Data-Driven Decisions",
    description: "Real-time analytics and insights right in your workflow.",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description: "SOC 2 compliant with end-to-end encryption built in.",
  },
  {
    icon: CheckCircle2,
    title: "Zero Config Setup",
    description: "Get started in minutes, not days. No complex configuration.",
  },
];

export function SolutionSection() {
  return (
    <section id="solution" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            There&apos;s a better way
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            LaunchKit replaces your entire toolchain with one intelligent platform.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
          {benefits.map((benefit) => (
            <Card key={benefit.title} className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6 flex gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
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

const HOW_IT_WORKS_SECTION_TSX = `import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    step: "01",
    title: "Connect Your Tools",
    description: "Link your existing repos, project boards, and communication channels in one click.",
    emoji: "🔗",
  },
  {
    step: "02",
    title: "Configure Workflows",
    description: "Use our visual builder to set up automated workflows — or pick from 50+ templates.",
    emoji: "⚙️",
  },
  {
    step: "03",
    title: "Ship with Confidence",
    description: "Deploy automatically with built-in testing, monitoring, and rollback capabilities.",
    emoji: "🚀",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Get up and running in three simple steps.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {steps.map((item, index) => (
            <div key={item.step} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-border" />
              )}
              <Card className="text-center relative">
                <CardContent className="pt-8 pb-8">
                  <div className="text-4xl mb-4">{item.emoji}</div>
                  <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-4">
                    Step {item.step}
                  </span>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;

const SOCIAL_PROOF_SECTION_TSX = `import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const logos = [
  { name: "Acme Inc", initials: "AI" },
  { name: "TechCorp", initials: "TC" },
  { name: "StartupXYZ", initials: "SX" },
  { name: "DevStudio", initials: "DS" },
  { name: "CloudBase", initials: "CB" },
  { name: "DataFlow", initials: "DF" },
];

const metrics = [
  { value: "1,200+", label: "Waitlist signups" },
  { value: "50+", label: "Beta testers" },
  { value: "4.9/5", label: "Satisfaction score" },
  { value: "10x", label: "Faster shipping" },
];

export function SocialProofSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-16">
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">{metric.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{metric.label}</p>
            </div>
          ))}
        </div>

        {/* Trusted by */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Trusted by teams at leading companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {logos.map((logo) => (
              <div key={logo.name} className="flex items-center gap-2 text-muted-foreground">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{logo.initials}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
`;

const FAQ_SECTION_TSX = `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "When will LaunchKit be available?",
    answer: "We\\'re planning to launch our public beta in Q2 2026. Join the waitlist to get early access and help shape the product.",
  },
  {
    question: "How much will it cost?",
    answer: "We\\'ll offer a free tier for individuals and small teams. Paid plans will start at $29/month with a generous feature set. Early adopters get 50% off for the first year.",
  },
  {
    question: "What integrations do you support?",
    answer: "At launch, we\\'ll support GitHub, GitLab, Slack, Jira, Linear, Notion, and more. We\\'re adding new integrations every week based on community feedback.",
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We\\'re SOC 2 Type II certified and use end-to-end encryption. Your code and data never leave your infrastructure unless you explicitly configure it to.",
  },
  {
    question: "Can I migrate from my current tools?",
    answer: "Yes! We provide automated migration tools for most popular platforms. Our team also offers white-glove migration support for enterprise customers.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about LaunchKit.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={\`faq-\${index}\`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
`;

const WAITLIST_SECTION_TSX = `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

export function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-purple-600 to-pink-500 px-6 py-16 md:px-16 md:py-24 text-center">
          <div className="absolute inset-0 -z-0 opacity-20">
            <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-white blur-3xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Don&apos;t miss the launch
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
              Be among the first to experience LaunchKit. Early access members
              get 50% off and direct access to our founding team.
            </p>

            {submitted ? (
              <div className="mt-10 text-white">
                <p className="text-2xl font-bold">🎉 You&apos;re on the list!</p>
                <p className="mt-2 text-white/80">
                  We&apos;ll be in touch soon. Check your inbox for a confirmation.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mx-auto mt-10 flex max-w-md flex-col sm:flex-row gap-3"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  required
                />
                <Button type="submit" variant="secondary" size="lg">
                  Join Waitlist
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            )}

            <p className="mt-4 text-sm text-white/60">
              No spam, ever. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
`;

const FOOTER_TSX = `import { Separator } from "@/components/ui/separator";
import { Rocket } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} LaunchKit. All rights reserved.
            </span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Twitter
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Discord
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

export const startupLandingTemplate: ProjectTemplate = {
  id: "landing-startup",
  name: "Startup Launch Page",
  description: "Bold product launch page with problem/solution, how-it-works, FAQ, and waitlist capture.",
  icon: "🎯",
  category: "landing-page",
  tags: ["startup", "launch", "waitlist", "product", "pre-launch"],

  files: {
    "app/page.tsx": PAGE_TSX,
    "app/components/navbar.tsx": NAVBAR_TSX,
    "app/components/hero-section.tsx": HERO_SECTION_TSX,
    "app/components/problem-section.tsx": PROBLEM_SECTION_TSX,
    "app/components/solution-section.tsx": SOLUTION_SECTION_TSX,
    "app/components/how-it-works-section.tsx": HOW_IT_WORKS_SECTION_TSX,
    "app/components/social-proof-section.tsx": SOCIAL_PROOF_SECTION_TSX,
    "app/components/faq-section.tsx": FAQ_SECTION_TSX,
    "app/components/waitlist-section.tsx": WAITLIST_SECTION_TSX,
    "app/components/footer.tsx": FOOTER_TSX,
  },

  plan: {
    description: "A startup product launch page with hero + email capture, problem/solution contrast, 3-step how-it-works, social proof metrics, FAQ accordion, and waitlist CTA banner.",
    steps: [
      "Write pre-built template files to the sandbox",
      "Customize product name, problem statements, and solution benefits based on user prompt",
      "Ensure responsive design and accessibility",
    ],
    filesToCreate: [
      "app/page.tsx",
      "app/components/navbar.tsx",
      "app/components/hero-section.tsx",
      "app/components/problem-section.tsx",
      "app/components/solution-section.tsx",
      "app/components/how-it-works-section.tsx",
      "app/components/social-proof-section.tsx",
      "app/components/faq-section.tsx",
      "app/components/waitlist-section.tsx",
      "app/components/footer.tsx",
    ],
    dependenciesToInstall: [],
  },

  customizationPrompt: `A complete startup launch page template has already been written to the sandbox with the following files:
- app/page.tsx (main page composing all sections)
- app/components/navbar.tsx (responsive nav)
- app/components/hero-section.tsx (headline + email waitlist capture)
- app/components/problem-section.tsx (3 pain-point cards with stats)
- app/components/solution-section.tsx (4 benefit cards)
- app/components/how-it-works-section.tsx (3-step process)
- app/components/social-proof-section.tsx (metrics + company logos)
- app/components/faq-section.tsx (5 FAQs in accordion)
- app/components/waitlist-section.tsx (CTA with email capture)
- app/components/footer.tsx (simple footer)

The template is ALREADY FUNCTIONAL. Your job is to CUSTOMIZE it based on the user's specific request.
Typical customizations:
- Change the product name, tagline, and value proposition
- Modify problem statements and supporting statistics
- Update solution benefits and descriptions
- Adjust FAQ questions and answers
- Change the color gradient or visual emphasis
- Add or remove sections as requested

IMPORTANT: Be FAST. Complete all changes in 3–5 tool calls total. Do NOT explore files one-by-one — read multiple files at once, then write all changes at once using createOrUpdateFiles with multiple files in a single call. Finish quickly.

DO NOT rebuild from scratch — modify the existing files. Read them first with readFiles if needed, then update using createOrUpdateFiles.`,
};
