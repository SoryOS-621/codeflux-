/**
 * @file infrastructure/database/prisma.ts
 * @description Prisma implementation of the DatabaseProvider interface.
 *
 * This is the ONLY file in the codebase that imports Prisma directly.
 * All other layers access the database through the DatabaseProvider interface.
 */

import type {
  DatabaseProvider,
  CreateProjectInput,
  CreateMessageInput,
  CreateMessageWithFragmentInput,
} from "@/services/database";
import type { Project, Message } from "@/types";
import prisma from "@/lib/prisma-client";

/**
 * Database provider backed by Prisma + PostgreSQL.
 *
 * Wraps all Prisma calls and maps Prisma model types to the
 * provider-agnostic domain types defined in `@/types`.
 */
export class PrismaDatabaseProvider implements DatabaseProvider {
  // -- Projects -------------------------------------------------------------

  async createProject(input: CreateProjectInput): Promise<Project> {
    const project = await prisma.project.create({
      data: {
        name: input.name,
        ...(input.initialMessage
          ? {
              messages: {
                create: {
                  content: input.initialMessage.content,
                  role: input.initialMessage.role,
                  type: input.initialMessage.type,
                },
              },
            }
          : {}),
      },
    });

    return {
      id: project.id,
      name: project.name,
      status: project.status as Project["status"],
      sandboxId: project.sandboxId,
      sandboxUrl: project.sandboxUrl,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  async getProjects(): Promise<Project[]> {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status as Project["status"],
      sandboxId: p.sandboxId,
      sandboxUrl: p.sandboxUrl,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  async getProjectById(id: string): Promise<Project | null> {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) return null;

    return {
      id: project.id,
      name: project.name,
      status: project.status as Project["status"],
      sandboxId: project.sandboxId,
      sandboxUrl: project.sandboxUrl,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  // -- Messages -------------------------------------------------------------

  async createMessage(input: CreateMessageInput): Promise<Message> {
    const message = await prisma.message.create({
      data: {
        projectId: input.projectId,
        content: input.content,
        role: input.role,
        type: input.type,
      },
    });

    return {
      id: message.id,
      content: message.content,
      role: message.role as Message["role"],
      type: message.type as Message["type"],
      projectId: message.projectId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  async createMessageWithFragment(
    input: CreateMessageWithFragmentInput,
  ): Promise<Message> {
    const message = await prisma.message.create({
      data: {
        projectId: input.projectId,
        content: input.content,
        role: input.role,
        type: input.type,
        fragment: {
          create: {
            sandboxUrl: input.fragment.sandboxUrl,
            title: input.fragment.title,
            files: input.fragment.files,
          },
        },
      },
    });

    return {
      id: message.id,
      content: message.content,
      role: message.role as Message["role"],
      type: message.type as Message["type"],
      projectId: message.projectId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  async getMessages(): Promise<Message[]> {
    const messages = await prisma.message.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return messages.map((m) => ({
      id: m.id,
      content: m.content,
      role: m.role as Message["role"],
      type: m.type as Message["type"],
      projectId: m.projectId,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  async getMessagesByProjectId(projectId: string): Promise<Message[]> {
    const messages = await prisma.message.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
    });

    return messages.map((m) => ({
      id: m.id,
      content: m.content,
      role: m.role as Message["role"],
      type: m.type as Message["type"],
      projectId: m.projectId,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  // -- Project Sandbox Management -------------------------------------------

  async getProjectSandboxId(projectId: string): Promise<string | null> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { sandboxId: true },
    });
    return project?.sandboxId ?? null;
  }

  async setProjectGenerating(
    projectId: string,
    sandboxId: string,
  ): Promise<void> {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "GENERATING",
        sandboxId,
      },
    });
  }

  async releaseProject(
    projectId: string,
    sandboxUrl?: string,
  ): Promise<void> {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "IDLE",
        // NOTE: sandboxId is NOT cleared — sandbox persists for reuse.
        // sandboxUrl is only updated if provided, otherwise it remains unchanged.
        ...(sandboxUrl ? { sandboxUrl } : {}),
      },
    });
  }

  async clearProjectSandbox(projectId: string): Promise<void> {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "IDLE",
        sandboxId: null,
      },
    });
  }
}
