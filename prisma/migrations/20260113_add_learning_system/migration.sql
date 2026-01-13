-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "targetSize" INTEGER DEFAULT 100,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "promptDiff" JSONB NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationOutcome" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "variantId" TEXT,
    "outcome" TEXT NOT NULL,
    "outcomeAt" TIMESTAMP(3) NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "visitorRole" TEXT,
    "companySize" TEXT,
    "industry" TEXT,
    "primaryInterest" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendlyEvent" (
    "id" TEXT NOT NULL,
    "calendlyEventId" TEXT NOT NULL,
    "conversationId" TEXT,
    "email" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendlyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMetrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "variantId" TEXT,
    "conversations" INTEGER NOT NULL DEFAULT 0,
    "scheduled" INTEGER NOT NULL DEFAULT 0,
    "qualified" INTEGER NOT NULL DEFAULT 0,
    "interested" INTEGER NOT NULL DEFAULT 0,
    "bounced" INTEGER NOT NULL DEFAULT 0,
    "avgMessages" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgDurationSec" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "DailyMetrics_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "experimentId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "variantId" TEXT;

-- CreateIndex
CREATE INDEX "Experiment_status_idx" ON "Experiment"("status");

-- CreateIndex
CREATE INDEX "Variant_experimentId_idx" ON "Variant"("experimentId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationOutcome_conversationId_key" ON "ConversationOutcome"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationOutcome_outcome_idx" ON "ConversationOutcome"("outcome");

-- CreateIndex
CREATE INDEX "ConversationOutcome_variantId_idx" ON "ConversationOutcome"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendlyEvent_calendlyEventId_key" ON "CalendlyEvent"("calendlyEventId");

-- CreateIndex
CREATE INDEX "CalendlyEvent_email_idx" ON "CalendlyEvent"("email");

-- CreateIndex
CREATE INDEX "CalendlyEvent_conversationId_idx" ON "CalendlyEvent"("conversationId");

-- CreateIndex
CREATE INDEX "DailyMetrics_date_idx" ON "DailyMetrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetrics_date_variantId_key" ON "DailyMetrics"("date", "variantId");

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationOutcome" ADD CONSTRAINT "ConversationOutcome_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationOutcome" ADD CONSTRAINT "ConversationOutcome_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMetrics" ADD CONSTRAINT "DailyMetrics_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
