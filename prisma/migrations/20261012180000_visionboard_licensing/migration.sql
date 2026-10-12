-- Licence Vision Boardu.
--
-- Licence sama se needviduje: nárok na ni plyne z existence účtu, takže
-- tabulka „kdo má licenci" by byla jen druhá kopie seznamu uživatelů.
-- Ukládá se jen to, co z účtu neplyne — zařízení a čekající kódy.

ALTER TABLE "User" ADD COLUMN "visionBoardRef" TEXT;
ALTER TABLE "User" ADD COLUMN "invitedById" TEXT;

CREATE UNIQUE INDEX "User_visionBoardRef_key" ON "User"("visionBoardRef");
CREATE INDEX "User_invitedById_idx" ON "User"("invitedById");

-- Smazání zvoucího nesmí vzít s sebou pozvaného, proto SET NULL.
ALTER TABLE "User" ADD CONSTRAINT "User_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "VisionBoardInstallation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRenewedAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "VisionBoardInstallation_pkey" PRIMARY KEY ("id")
);

-- Táž dvojice je totéž zařízení. Bez téhle unikátnosti by se dal limit
-- tří zařízení obejít prostým zopakováním aktivace.
CREATE UNIQUE INDEX "VisionBoardInstallation_userId_installationId_key"
  ON "VisionBoardInstallation"("userId", "installationId");
CREATE INDEX "VisionBoardInstallation_userId_deactivatedAt_idx"
  ON "VisionBoardInstallation"("userId", "deactivatedAt");

ALTER TABLE "VisionBoardInstallation" ADD CONSTRAINT "VisionBoardInstallation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "VisionBoardActivationCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    -- Otisk, ne kód. Kdo se dostane k databázi, nesmí umět aktivovat
    -- cizím jménem.
    "codeHash" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisionBoardActivationCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VisionBoardActivationCode_codeHash_key"
  ON "VisionBoardActivationCode"("codeHash");
CREATE INDEX "VisionBoardActivationCode_userId_idx"
  ON "VisionBoardActivationCode"("userId");
CREATE INDEX "VisionBoardActivationCode_expiresAt_idx"
  ON "VisionBoardActivationCode"("expiresAt");

ALTER TABLE "VisionBoardActivationCode" ADD CONSTRAINT "VisionBoardActivationCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
