-- Kolik myšlenek na den už uživateli doručených odešlo.
--
-- Text se dosud vybíral jako „kolikátý je den od založení účtu, zbytek
-- po dělení počtem textů". Při deseti textech chodily od jedenáctého
-- dne dokola ty samé, i se stejným titulkem v oznámení.
--
-- Počitadlo začíná na nule i u stávajících účtů. Ti tedy uvidí knihovnu
-- znovu od začátku — texty, které jim chodily dokola, prošly, a projít
-- je po pořádku je lepší než je přeskočit.
ALTER TABLE "User" ADD COLUMN "motivationSent" INTEGER NOT NULL DEFAULT 0;
