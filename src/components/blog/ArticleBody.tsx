import type { ArticleBlock } from "@/content/articles";

/**
 * Sazba článku.
 *
 * Záměrně se nepoužívá typografický balík ani `prose` třídy. Ty umí
 * všechno a právě proto jejich výsledek vypadá na každém webu stejně —
 * a tenhle web má vlastní písma, vlastní barvy a vlastní rytmus.
 *
 * Rozhodnutí, která tu drží text pohromadě:
 *
 *  - Šířka sazby je omezená na zhruba 68 znaků. Delší řádek se čte hůř,
 *    protože oko na konci nenajde začátek toho dalšího.
 *  - První odstavec je větší než ostatní. Je to vstup do textu a dává
 *    článku začátek, aniž by bylo potřeba cokoliv dopisovat.
 *  - Mezititulky mají nad sebou víc místa než pod sebou. Patří k textu,
 *    který následuje, ne k tomu, který skončil — a oko to musí poznat.
 *  - Citace nemá uvozovky ani kurzívu, jen svislou linku a jiný odstín.
 *    Uvozovky uvnitř citace by se s nimi tloukly.
 */
export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  // Ať je první odstavec větší, ať je článek začíná čímkoliv.
  const firstParagraph = blocks.findIndex((block) => block.kind === "p");

  return (
    <div className="mx-auto max-w-[68ch]">
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;

        if (block.kind === "h2") {
          return (
            <h2
              key={key}
              className="display mt-14 text-2xl leading-snug text-[var(--color-paper)] sm:text-3xl"
            >
              {block.text}
            </h2>
          );
        }

        if (block.kind === "quote") {
          return (
            <blockquote
              key={key}
              className="my-12 border-l-2 border-[color-mix(in_oklab,var(--color-lime-glow)_55%,transparent)] pl-6"
            >
              <p className="display text-xl leading-snug text-[var(--color-paper)] sm:text-2xl">
                {block.text}
              </p>
            </blockquote>
          );
        }

        if (block.kind === "list") {
          return (
            <ul key={key} className="mt-6 space-y-3">
              {block.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-4 text-base leading-relaxed text-[var(--color-paper-dim)]"
                >
                  {/* Vlastní odrážka místo výchozí tečky — ta je na tmavém
                      podkladu buď neviditelná, nebo příliš tvrdá. */}
                  <span
                    aria-hidden="true"
                    className="mt-[0.7em] h-px w-4 shrink-0 bg-[color-mix(in_oklab,var(--color-lime-glow)_60%,transparent)]"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }

        const isLede = index === firstParagraph;

        return (
          <p
            key={key}
            className={
              isLede
                ? "text-xl leading-relaxed text-[var(--color-paper)]"
                : "mt-6 text-base leading-relaxed text-[var(--color-paper-dim)]"
            }
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
