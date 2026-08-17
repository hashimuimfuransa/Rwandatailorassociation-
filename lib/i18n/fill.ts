/**
 * Fills `{name}` placeholders in a translated string.
 *
 * Translations cannot be assembled by concatenating fragments: Kinyarwanda puts
 * words in a different order from English, so "Account {number} opened {date}"
 * has to stay one sentence the translator can rearrange. This substitutes the
 * values wherever that sentence chose to put them.
 */
export function fill(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );
}

/**
 * Picks the singular or plural half of a template and fills it.
 *
 * The two forms are held in one string separated by a pipe — "{days} day
 * late|{days} days late" — so the translator sees both together and cannot
 * supply one without the other. Kinyarwanda inflects the noun rather than
 * appending an s ("umunsi" / "iminsi"), which is exactly why the whole phrase
 * has to be translated twice instead of an "s" being bolted on in code.
 */
export function pluralize(
  template: string,
  count: number,
  values: Record<string, string | number> = {}
): string {
  const [one, many] = template.split("|");
  const chosen = count === 1 ? one : (many ?? one);
  return fill(chosen, { count, ...values });
}

/**
 * Splits a template into the text around a single `{name}` placeholder, for the
 * sentences that need markup — a bold payment reference mid-sentence — rather
 * than a plain string.
 */
export function split(
  template: string,
  key: string
): [before: string, after: string] {
  const index = template.indexOf(`{${key}}`);
  if (index === -1) return [template, ""];
  return [template.slice(0, index), template.slice(index + key.length + 2)];
}
