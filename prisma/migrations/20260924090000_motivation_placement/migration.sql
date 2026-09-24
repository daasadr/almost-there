-- Kde na dnešku ukazovat myšlenku na den, a jestli vůbec.
--
-- Výchozí je pod checklistem: nahoře je delší text první věc, co člověk
-- ráno uvidí, a odsune tím úkoly pod okraj obrazovky. Myšlenka na den je
-- doprovod, ne program.
CREATE TYPE "MotivationPlacement" AS ENUM ('OFF', 'ABOVE', 'BELOW');

ALTER TABLE "User"
  ADD COLUMN "motivationPlacement" "MotivationPlacement" NOT NULL DEFAULT 'BELOW';
