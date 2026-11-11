-- Migration: add_workflow
-- Generated manually to avoid requiring a live DATABASE_URL for migration creation

-- Create enum types
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflowstatus') THEN
        CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT','ACTIVE','DISABLED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'executionstatus') THEN
        CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING','RUNNING','SUCCEEDED','FAILED','CANCELLED');
    END IF;
END$$;

-- Create Workflow table
CREATE TABLE IF NOT EXISTS "Workflow" (
  id TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,
  status "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
  version INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Workflow_tenant_idx" ON "Workflow"("tenantId");
CREATE INDEX IF NOT EXISTS "Workflow_user_idx" ON "Workflow"("userId");
CREATE INDEX IF NOT EXISTS "Workflow_status_idx" ON "Workflow"(status);

-- Create WorkflowExecution table
CREATE TABLE IF NOT EXISTS "WorkflowExecution" (
  id TEXT PRIMARY KEY,
  "workflowId" TEXT NOT NULL REFERENCES "Workflow"(id) ON DELETE CASCADE,
  status "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
  input JSONB,
  output JSONB,
  logs JSONB,
  "startedAt" TIMESTAMPTZ,
  "finishedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "WorkflowExecution_workflow_idx" ON "WorkflowExecution"("workflowId");
CREATE INDEX IF NOT EXISTS "WorkflowExecution_status_idx" ON "WorkflowExecution"(status);
CREATE INDEX IF NOT EXISTS "WorkflowExecution_created_idx" ON "WorkflowExecution"("createdAt");
