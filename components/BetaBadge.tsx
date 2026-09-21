/**
 * The beta indicator, for the adult (Beta 0.1).
 *
 * A tester has to know they are testing, or their silence means nothing. It is one small badge
 * beside the product name and a single sentence — enough to say « this is a test release and your
 * notes are wanted », and little enough that a parent opening a lesson is not reading a notice
 * instead.
 *
 * Deliberately **parent-facing only**. It is not rendered inside the session or on the child's
 * fullscreen screen, where nothing that is not the lesson belongs (ADR-043). It collects nothing:
 * there is no link out, no form, no account and no request — the tester's note stays in their own
 * browser until they choose to send it (ADR-006).
 */
export function BetaBadge() {
  return (
    <span className="rounded-full bg-amber-100 px-3 py-1 align-middle text-base font-semibold text-amber-900">
      Beta
    </span>
  );
}

export function BetaNote() {
  return (
    <p className="text-base text-stone-600">
      Version d’essai. Après une séance, la page « Comment ça s’est passé ? » prépare un compte
      rendu que vous pouvez copier et nous envoyer par votre canal habituel. Rien n’est envoyé
      automatiquement, et rien sur votre enfant n’est enregistré.
    </p>
  );
}
