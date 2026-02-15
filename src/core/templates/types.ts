/**
 * @file core/templates/types.ts
 * @description Types for the preconfigured project template system.
 *
 * Templates provide pre-built file sets that are seeded into the sandbox
 * BEFORE the agent runs, dramatically reducing generation time.
 */

// ---------------------------------------------------------------------------
// Template Types
// ---------------------------------------------------------------------------

/**
 * A preconfigured project template.
 *
 * Templates contain:
 * - Metadata (id, name, description, icon, tags)
 * - Pre-built files that get written directly to the sandbox
 * - A pre-defined plan so the PlannerAgent can be skipped
 * - A customization prompt that tells the CoderAgent what to modify
 */
export interface ProjectTemplate {
  /** Unique template identifier (e.g. "landing-page-saas"). */
  id: string;

  /** Display name shown in the UI. */
  name: string;

  /** Short description shown in the UI. */
  description: string;

  /** Emoji icon for the template card. */
  icon: string;

  /** Category for grouping templates. */
  category: TemplateCategory;

  /** Tags for filtering/search. */
  tags: string[];

  /**
   * Pre-built files to seed into the sandbox.
   * Key = relative path (e.g. "app/page.tsx"), Value = file content.
   */
  files: Record<string, string>;

  /**
   * Pre-defined plan that replaces the PlannerAgent output.
   * This skips the AI planning step entirely.
   */
  plan: {
    description: string;
    steps: string[];
    filesToCreate: string[];
    dependenciesToInstall: string[];
  };

  /**
   * Customization prompt injected into the CoderAgent.
   * Tells the AI what's already built and what to customize.
   */
  customizationPrompt: string;
}

/** Template categories for UI grouping. */
export type TemplateCategory =
  | "landing-page"
  | "dashboard"
  | "portfolio"
  | "blog"
  | "e-commerce"
  | "game"
  | "utility";
