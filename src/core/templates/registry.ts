/**
 * @file core/templates/registry.ts
 * @description Template registry — central lookup for all preconfigured project templates.
 *
 * All templates are registered here. The registry provides:
 * - Lookup by ID
 * - Listing all templates (for the UI)
 * - Filtering by category
 *
 * To add a new template, import it and add to `ALL_TEMPLATES`.
 */

import type { ProjectTemplate, TemplateCategory } from "./types";
import { saasLandingTemplate } from "./landing-pages/saas-landing";
import { portfolioLandingTemplate } from "./landing-pages/portfolio-landing";
import { startupLandingTemplate } from "./landing-pages/startup-landing";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/** All registered templates, ordered by display priority. */
const ALL_TEMPLATES: ProjectTemplate[] = [
  saasLandingTemplate,
  portfolioLandingTemplate,
  startupLandingTemplate,
];

/**
 * Look up a template by its unique ID.
 * @returns The template, or `undefined` if not found.
 */
export function getTemplateById(id: string): ProjectTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get all registered templates (for listing in the UI).
 */
export function getAllTemplates(): ProjectTemplate[] {
  return ALL_TEMPLATES;
}

/**
 * Get templates filtered by category.
 */
export function getTemplatesByCategory(
  category: TemplateCategory,
): ProjectTemplate[] {
  return ALL_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get template metadata for the UI (without the file contents to keep payloads small).
 */
export function getTemplateMetadata(): Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  category: TemplateCategory;
  tags: string[];
}> {
  return ALL_TEMPLATES.map(({ id, name, description, icon, category, tags }) => ({
    id,
    name,
    description,
    icon,
    category,
    tags,
  }));
}
