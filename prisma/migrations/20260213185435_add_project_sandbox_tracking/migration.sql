-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('IDLE', 'GENERATING');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "sandboxId" TEXT,
ADD COLUMN     "sandboxUrl" TEXT,
ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'IDLE';
