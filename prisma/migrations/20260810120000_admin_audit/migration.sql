-- Trvalý záznam zásahů provozovatele do zákaznických účtů.
--
-- Do logu kontejneru se psaly taky, jenže ten se po čase přetáčí —
-- a záznam, který zmizí, není záznam.
CREATE TABLE "AdminAuditEvent" (
    "id" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAuditEvent_createdAt_idx" ON "AdminAuditEvent"("createdAt");
CREATE INDEX "AdminAuditEvent_targetUserId_idx" ON "AdminAuditEvent"("targetUserId");
