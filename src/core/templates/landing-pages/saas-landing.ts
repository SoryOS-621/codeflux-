/**
 * @file core/templates/landing-pages/saas-landing.ts
 * @description SaaS Landing Page template — a modern, production-ready
 * landing page with hero, features, pricing, testimonials, CTA, and footer.
 *
 * All files use Tailwind CSS + Shadcn UI components (pre-installed).
 * No external dependencies required.
 */

import type { ProjectTemplate } from "../types";

// ---------------------------------------------------------------------------
// Template File Contents
// ---------------------------------------------------------------------------

const PAGE_TSX = `"use client";

import { HeroSection } from "./components/hero-section";
import { FeaturesSection } from "./components/features-section";
import { PricingSection } from "./components/pricing-section";
import { TestimonialsSection } from "./components/testimonials-section";
import { CTASection } from "./components/cta-section";
import { Footer } from "./components/footer";
import { Navbar } from "./components/navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
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
import { Menu, X, Zap } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 font-bold text-xl">
          <Zap className="h-6 w-6 text-primary" />
          <span>SaaSify</span>
        </a>

        {/* Desktop Nav */}
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

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm">
            Log in
          </Button>
          <Button size="sm">Get Started</Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <div className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-4">
                <Button variant="outline">Log in</Button>
                <Button>Get Started</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
`;

const HERO_SECTION_TSX = `"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />

      <div className="container mx-auto px-4 text-center">
        {/* Announcement badge */}
        <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          New: AI-powered analytics now available
        </Badge>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Build faster with{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            intelligent tools
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Streamline your workflow, boost productivity, and ship products 10x faster
          with our all-in-one platform designed for modern teams.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="text-base px-8">
            Start Free Trial
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" className="text-base px-8">
            Watch Demo
          </Button>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-sm text-muted-foreground">
          Trusted by 10,000+ teams worldwide &bull; No credit card required
        </p>

        {/* Hero visual placeholder */}
        <div className="mx-auto mt-16 max-w-5xl rounded-xl border bg-muted/30 shadow-2xl aspect-video flex items-center justify-center">
          <div className="text-muted-foreground text-lg">
            🖥️ Product Dashboard Preview
          </div>
        </div>
      </div>
    </section>
  );
}
`;

const FEATURES_SECTION_TSX = `import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Zap,
  Shield,
  BarChart3,
  Users,
  Globe,
  Layers,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Optimized for speed with sub-second response times. Your team stays productive without waiting.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "SOC 2 compliant with end-to-end encryption, SSO, and role-based access controls.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Deep insights into your workflow with customizable dashboards and real-time reporting.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Built for teams of any size. Real-time editing, comments, and seamless handoffs.",
  },
  {
    icon: Globe,
    title: "Global CDN",
    description:
      "Deploy to 200+ edge locations worldwide. Your content loads fast, everywhere.",
  },
  {
    icon: Layers,
    title: "Integrations",
    description:
      "Connect with 100+ tools you already use. Slack, GitHub, Jira, and more.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Everything you need to ship faster
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive suite of tools designed to help your team build,
            deploy, and scale with confidence.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-2">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
`;

const PRICING_SECTION_TSX = `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Perfect for individuals and small projects.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Up to 3 projects",
      "1 GB storage",
      "Basic analytics",
      "Community support",
      "API access",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    description: "For growing teams and businesses.",
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      "Unlimited projects",
      "100 GB storage",
      "Advanced analytics",
      "Priority support",
      "API access",
      "Custom integrations",
      "Team collaboration",
      "SSO authentication",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large organizations with custom needs.",
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "Custom analytics",
      "24/7 dedicated support",
      "SLA guarantee",
      "Custom contracts",
      "Audit logs",
      "SAML SSO",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade at any time.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <Label htmlFor="billing-toggle" className="text-sm font-medium">
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={annual}
              onCheckedChange={setAnnual}
            />
            <Label htmlFor="billing-toggle" className="text-sm font-medium">
              Annual
              <Badge variant="secondary" className="ml-2 text-xs">
                Save 20%
              </Badge>
            </Label>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={\`relative flex flex-col \${plan.popular ? "border-primary shadow-lg scale-105" : "border"}\`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-center mb-6">
                  <span className="text-5xl font-bold">
                    $
                    {annual ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">
                    /{annual ? "year" : "month"}
                  </span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  {plan.cta}
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

const TESTIMONIALS_SECTION_TSX = `import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CTO at TechFlow",
    initials: "SC",
    content:
      "SaaSify has transformed how our team works. We shipped our latest product 3x faster than before. The analytics alone are worth the price.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Founder at LaunchPad",
    initials: "MJ",
    content:
      "I\\'ve tried dozens of tools. SaaSify is the first one that actually delivers on its promises. Our team productivity went through the roof.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "VP Engineering at ScaleUp",
    initials: "ER",
    content:
      "The integrations are seamless, the support is incredible, and it just works. We migrated our entire workflow in a weekend.",
    rating: 5,
  },
  {
    name: "Alex Kim",
    role: "Product Lead at InnovateCo",
    initials: "AK",
    content:
      "From onboarding to deployment, everything was smooth. The team collaboration features are exactly what we needed.",
    rating: 5,
  },
  {
    name: "Jordan Williams",
    role: "DevOps at CloudNine",
    initials: "JW",
    content:
      "The global CDN performance is outstanding. Our page load times dropped by 60% after switching to SaaSify.",
    rating: 5,
  },
  {
    name: "Priya Patel",
    role: "CEO at GrowthBase",
    initials: "PP",
    content:
      "Enterprise-grade features at a startup-friendly price. SaaSify is exactly what the market needed.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Loved by teams everywhere
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from real customers who have transformed their workflow with SaaSify.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="border-0 shadow-sm">
              <CardContent className="pt-6">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs font-medium">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
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

const CTA_SECTION_TSX = `import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 md:px-16 md:py-24 text-center">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-0 opacity-10">
            <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-white blur-3xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl md:text-5xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
              Join 10,000+ teams already using SaaSify to build better products, faster.
              Start your free trial today — no credit card required.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                variant="secondary"
                className="text-base px-8"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
`;

const FOOTER_TSX = `import { Separator } from "@/components/ui/separator";
import { Zap } from "lucide-react";

const footerLinks = {
  Product: ["Features", "Pricing", "Integrations", "Changelog", "Docs"],
  Company: ["About", "Blog", "Careers", "Press", "Contact"],
  Resources: ["Community", "Help Center", "Status", "API Reference", "Templates"],
  Legal: ["Privacy", "Terms", "Security", "Cookies"],
};

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a href="#" className="flex items-center gap-2 font-bold text-xl mb-4">
              <Zap className="h-6 w-6 text-primary" />
              <span>SaaSify</span>
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Build faster with intelligent tools. The all-in-one platform for modern teams.
            </p>
          </div>

          {/* Link groups */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="font-semibold text-sm mb-3">{group}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SaaSify. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Twitter
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              LinkedIn
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

export const saasLandingTemplate: ProjectTemplate = {
  id: "landing-saas",
  name: "SaaS Landing Page",
  description: "Modern SaaS landing page with hero, features, pricing, testimonials, and CTA sections.",
  icon: "🚀",
  category: "landing-page",
  tags: ["saas", "startup", "marketing", "pricing", "landing"],

  files: {
    "app/page.tsx": PAGE_TSX,
    "app/components/navbar.tsx": NAVBAR_TSX,
    "app/components/hero-section.tsx": HERO_SECTION_TSX,
    "app/components/features-section.tsx": FEATURES_SECTION_TSX,
    "app/components/pricing-section.tsx": PRICING_SECTION_TSX,
    "app/components/testimonials-section.tsx": TESTIMONIALS_SECTION_TSX,
    "app/components/cta-section.tsx": CTA_SECTION_TSX,
    "app/components/footer.tsx": FOOTER_TSX,
  },

  plan: {
    description: "A modern SaaS landing page with responsive navbar, hero section, feature grid, pricing cards with annual toggle, testimonial cards, CTA banner, and footer with link groups.",
    steps: [
      "Write pre-built template files to the sandbox",
      "Customize branding, copy, and sections based on user prompt",
      "Ensure responsive design and accessibility",
    ],
    filesToCreate: [
      "app/page.tsx",
      "app/components/navbar.tsx",
      "app/components/hero-section.tsx",
      "app/components/features-section.tsx",
      "app/components/pricing-section.tsx",
      "app/components/testimonials-section.tsx",
      "app/components/cta-section.tsx",
      "app/components/footer.tsx",
    ],
    dependenciesToInstall: [],
  },

  customizationPrompt: `A complete SaaS landing page template has already been written to the sandbox with the following files:
- app/page.tsx (main page composing all sections)
- app/components/navbar.tsx (responsive nav with mobile menu)
- app/components/hero-section.tsx (hero with headline, CTA, social proof)
- app/components/features-section.tsx (6-feature grid with icons)
- app/components/pricing-section.tsx (3-tier pricing with annual toggle)
- app/components/testimonials-section.tsx (6 testimonial cards)
- app/components/cta-section.tsx (CTA banner)
- app/components/footer.tsx (footer with link groups)

The template is ALREADY FUNCTIONAL. Your job is to CUSTOMIZE it based on the user's specific request.
Typical customizations:
- Change the brand name, tagline, and copy
- Adjust feature names, icons, and descriptions
- Modify pricing tiers, prices, and feature lists
- Update testimonial names and quotes
- Change color scheme or layout emphasis
- Add or remove sections as requested

DO NOT rebuild from scratch — modify the existing files. Read them first with readFiles if needed, then update using createOrUpdateFiles.
Focus on making the content specific to what the user asked for.

IMPORTANT: Be FAST. Complete all changes in 3–5 tool calls total. Do NOT explore files one-by-one — read multiple files at once, then write all changes at once using createOrUpdateFiles with multiple files in a single call. Finish quickly.`,
};
