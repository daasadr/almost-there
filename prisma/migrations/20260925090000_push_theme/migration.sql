-- Zvolený vzhled na zařízení, které odebírá oznámení.
--
-- Sedí u odběru, ne u uživatele: motiv je věc zařízení a oka, ne profilu,
-- a odběr oznámení je taky per zařízení. Slouží k výběru ikony a obrázku
-- v oznámení — ty jsou jediné dvě plochy, do kterých nám systém dovolí
-- mluvit.
ALTER TABLE "PushSubscription" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'classic';
