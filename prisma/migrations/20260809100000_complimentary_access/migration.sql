-- Přístup přidělený provozovatelem: testeři, výherci, blízcí.
-- Neplatí se za něj, ale limity použití platí stejně jako u placených.
ALTER TYPE "SubscriptionSource" ADD VALUE 'COMPLIMENTARY';

-- Proč byl přístup přidělen. Bez poznámky se za rok nedá poznat,
-- který z rozdaných účtů se má nechat a který zrušit.
ALTER TABLE "User" ADD COLUMN "subscriptionNote" TEXT;
