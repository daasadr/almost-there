-- Vlastní druh volání modelu pro zaplacené plány v PDF.
--
-- Do měsíčního limitu nových plánů se počítají záznamy DECOMPOSE_GOAL.
-- Zaplacený plán ho ukrajovat nesmí — a naopak, kdo si koupí PDF
-- a předplatné nemá, žádný limit nemá.
--
-- Postgres od verze 12 dovolí přidat hodnotu v transakci, pokud se ve
-- stejné transakci nepoužije. Tady se jen zavádí.
ALTER TYPE "AiOperation" ADD VALUE IF NOT EXISTS 'PDF_PLAN';
