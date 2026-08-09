-- Od kdy jsou přihlášení platná.
--
-- Přihlášení nosí uživatel v podepsaném tokenu, který server nedokáže
-- odvolat. Po změně hesla se tahle značka posune a všechny dřív vydané
-- tokeny ztratí platnost — jinak by ukradené přihlášení přežilo změnu
-- hesla o třicet dní.
ALTER TABLE "User" ADD COLUMN "sessionsValidFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
