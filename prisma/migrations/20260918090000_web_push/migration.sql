-- Webová oznámení.
--
-- Aplikace na dlouhé cíle stojí na tom, že ji člověk otevře i ve dnech,
-- kdy se mu nechce. Android aplikace připomínku uměla odjakživa přes
-- systémový plugin, web ne — a web je to, co má většina lidí.

CREATE TYPE "NotifyMode" AS ENUM ('OFF', 'DAILY', 'WEEKLY');

ALTER TABLE "User" ADD COLUMN "notifyMode" "NotifyMode" NOT NULL DEFAULT 'OFF';
ALTER TABLE "User" ADD COLUMN "notifyTime" TEXT NOT NULL DEFAULT '07:00';
ALTER TABLE "User" ADD COLUMN "notifyEvening" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "notifySnoozedUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "notifiedOn" TEXT;
ALTER TABLE "User" ADD COLUMN "notifiedEveningOn" TEXT;

-- Jeden člověk má klidně několik zařízení a každé má vlastní adresu
-- u poštovní služby svého prohlížeče.
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
