CREATE TABLE "AIUsageEvent" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIUsageEvent_clerkUserId_createdAt_idx" ON "AIUsageEvent"("clerkUserId", "createdAt");
CREATE INDEX "AIUsageEvent_provider_createdAt_idx" ON "AIUsageEvent"("provider", "createdAt");
