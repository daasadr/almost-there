-- Barva cíle. Ukládá se název z palety, ne odstín — vzhled se pak dá
-- doladit bez migrace dat.
--
-- Výchozí "lime" je barva, kterou má aplikace dosud; existující cíle tak
-- vypadají stejně jako předtím.
ALTER TABLE "Goal" ADD COLUMN "color" TEXT NOT NULL DEFAULT 'lime';
