-- Kdy odešla připomínka, že končí zkušební období.
--
-- Zkouška přejde v placené sama, takže dva dny předem chodí e-mail — bez
-- něj by to byla past na zapomnětlivé. Tenhle údaj hlídá, že odejde
-- jednou: rozesílání běží každých pár minut a bez značky by přišel
-- pokaždé znovu.
ALTER TABLE "User" ADD COLUMN "trialReminderSentAt" TIMESTAMP(3);
