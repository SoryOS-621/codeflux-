/**
 * @file infrastructure/sandbox/docker.ts
 * @description Docker implementation of the SandboxProvider interface.
 *
 * STUB — this file provides the structure for a self-hosted Docker sandbox
 * provider. Replace the TODO implementations with actual Docker API calls
 * when switching from E2B to self-hosted Docker containers.
 */

import type { SandboxProvider } from "@/services/sandbox";
import type { ExecutionResult, SandboxFile, SandboxLogEntry } from "@/types";

/**
 * Sandbox provider backed by self-hosted Docker containers.
 *
 * To use this provider, update the central wiring in
 * `src/infrastructure/index.ts` to instantiate `DockerSandboxProvider`
 * instead of `E2BSandboxProvider`.
 */
export class DockerSandboxProvider implements SandboxProvider {
  async create(_template: string): Promise<string> {
    // TODO: Implement Docker container creation
    // e.g. docker.createContainer({ Image: template, ... })
    throw new Error("DockerSandboxProvider.create() not implemented yet");
  }

  async connect(_sandboxId: string): Promise<void> {
    // TODO: Verify container is running
    throw new Error("DockerSandboxProvider.connect() not implemented yet");
  }

  async execute(
    _sandboxId: string,
    _command: string,
  ): Promise<ExecutionResult> {
    // TODO: docker exec inside the container
    throw new Error("DockerSandboxProvider.execute() not implemented yet");
  }

  async writeFiles(
    _sandboxId: string,
    _files: SandboxFile[],
  ): Promise<void> {
    // TODO: docker cp or exec to write files
    throw new Error("DockerSandboxProvider.writeFiles() not implemented yet");
  }

  async readFiles(
    _sandboxId: string,
    _paths: string[],
  ): Promise<SandboxFile[]> {
    // TODO: docker exec cat or docker cp to read files
    throw new Error("DockerSandboxProvider.readFiles() not implemented yet");
  }

  async getPreviewUrl(
    _sandboxId: string,
    _port: number,
  ): Promise<string> {
    // TODO: Return the mapped host:port URL
    throw new Error(
      "DockerSandboxProvider.getPreviewUrl() not implemented yet",
    );
  }

  async isAlive(_sandboxId: string): Promise<boolean> {
    // TODO: Check if Docker container is running
    throw new Error("DockerSandboxProvider.isAlive() not implemented yet");
  }

  async getLogs(
    _sandboxId: string,
    _opts?: { limit?: number; startMs?: number },
  ): Promise<SandboxLogEntry[]> {
    // TODO: docker logs <container>
    throw new Error("DockerSandboxProvider.getLogs() not implemented yet");
  }

  async kill(_sandboxId: string): Promise<void> {
    // TODO: docker kill / docker rm
    throw new Error("DockerSandboxProvider.kill() not implemented yet");
  }
}
