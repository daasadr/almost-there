/**
 * Vloží strukturovaná data do stránky.
 *
 * Je to `<script>`, ale nic se nespouští — typ `application/ld+json`
 * prohlížeč nespustí, jen tam ta data leží pro toho, kdo si je přijde
 * přečíst.
 *
 * Data skládáme z konstant v kódu, ne z ničeho, co by přišlo od
 * uživatele. Kdyby to tak jednou být mělo, musí se řetězce nejdřív
 * očistit — `</script>` uvnitř by jinak stránku rozseklo vejpůl.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
