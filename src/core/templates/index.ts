/**
 * @file core/templates/index.ts
 * @description Public API for the template system.
 *
 * Re-exports everything consumers need: types, registry functions.
 */

export type { ProjectTemplate, TemplateCategory } from "./types";
export {
  getTemplateById,
  getAllTemplates,
  getTemplatesByCategory,
  getTemplateMetadata,
} from "./registry";
