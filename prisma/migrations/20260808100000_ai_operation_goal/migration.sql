-- Rozpad nově založeného cíle dostává vlastní hodnotu.
--
-- Podle počtu těchhle záznamů se počítá měsíční limit nových plánů.
-- Doteď sdílel hodnotu s rozpadem roku na měsíce, takže je nešlo rozlišit.
ALTER TYPE "AiOperation" ADD VALUE 'DECOMPOSE_GOAL' AFTER 'DEMO_MONTHLY';
