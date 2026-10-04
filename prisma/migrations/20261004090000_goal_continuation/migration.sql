-- Na který dotažený cíl tenhle navazuje.
--
-- Rozšířit původní cíl by znamenalo vzít zpátky jeho dotažení a z hotové
-- věci udělat zase rozdělanou. Navazující cíl ten úspěch nechá být a jen
-- z něj vyjde: výchozím bodem plánu je to, kde člověk skončil.
ALTER TABLE "Goal" ADD COLUMN "continuesFromId" TEXT;
