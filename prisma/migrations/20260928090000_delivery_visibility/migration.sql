-- Vidět, jestli rozesílání vůbec běží a jak dopadlo.
--
-- Když se cron rozbije, nic nespadne a nic se nenahlásí — jen přestanou
-- chodit zprávy. To je nejhorší druh poruchy, protože se pozná jedině
-- tím, že si někdo postěžuje. Tyhle tři sloupce na to odpovídají
-- jedním pohledem.
CREATE TABLE "CronRun" (
  "job"   TEXT NOT NULL,
  "ranAt" TIMESTAMP(3) NOT NULL,
  "note"  TEXT,
  CONSTRAINT "CronRun_pkey" PRIMARY KEY ("job")
);

ALTER TABLE "PushSubscription" ADD COLUMN "lastSentAt" TIMESTAMP(3);
ALTER TABLE "PushSubscription" ADD COLUMN "lastError"  TEXT;
