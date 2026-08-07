-- Jazyk plánu patří k cíli, ne k uživateli.
--
-- U účtů založených přes Google zůstávalo `User.locale` na výchozím "en",
-- takže se plán generoval anglicky i lidem, kteří aplikaci používají česky.
ALTER TABLE "Goal" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
