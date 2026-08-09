-- Výslovný souhlas se zahájením plnění před uplynutím lhůty pro odstoupení.
--
-- Podle § 1837 OZ nestačí obecné odsouhlasení podmínek při registraci:
-- souhlas musí být samostatný, projevený u nákupu, a podnikatel o něm
-- musí vydat potvrzení. Ukládá se proto zvlášť, i s verzí dokumentu.
ALTER TYPE "ConsentType" ADD VALUE 'IMMEDIATE_PERFORMANCE';
