import {
  MAX_OBSERVATION_BYTES,
  MAX_TRANSFER_BYTES,
  MAX_TRANSFER_ENTRIES,
  TRANSFER_FIELDS,
  TRANSFER_FORMAT,
  TRANSFER_VERSION,
  type TransferSession,
} from "./session-transfer";

/** Owner-run, read-only exporter for an older origin which has no transfer screen. */
export function localProgressExportConsole(sessions: readonly TransferSession[]): string {
  const groups = new Map<string, { schoolYearId: string; levelId: string; days: number[][] }>();
  for (const { schoolYearId, levelId, instructionalDay, activityCount } of sessions) {
    const id = JSON.stringify([schoolYearId, levelId]);
    const group = groups.get(id) ?? { schoolYearId, levelId, days: [] };
    group.days.push([instructionalDay, activityCount]);
    groups.set(id, group);
  }
  return `// Teka Edu: local export only. No storage writes, network requests or observation logging.
(() => {
  // prettier-ignore
  const groups = ${JSON.stringify([...groups.values()])};
  const fields = ${JSON.stringify(TRANSFER_FIELDS)};
  const entries = [];
  let excluded = 0;
  const size = (text) => new TextEncoder().encode(text).byteLength;
  for (const group of groups) for (const [day, activityCount] of group.days) for (const field of fields) {
    const key = \`teka-edu.session.v2.\${encodeURIComponent(group.schoolYearId)}.\${encodeURIComponent(group.levelId)}.\${day}.\${field}\`;
    const value = localStorage.getItem(key);
    if (value === null) continue;
    const number = Number(value);
    const valid = field === "progress" ? ["not_started", "in_progress", "completed"].includes(value)
      : field === "position" ? /^(0|[1-9]\\d*)$/.test(value) && Number.isSafeInteger(number) && number < activityCount
      : field === "updatedAt" ? /^[1-9]\\d*$/.test(value) && Number.isSafeInteger(number) && number <= 8640000000000000
      : size(value) <= ${MAX_OBSERVATION_BYTES};
    if (valid) entries.push({ key, value });
    else excluded++;
  }
  const text = JSON.stringify({ format: ${JSON.stringify(TRANSFER_FORMAT)}, version: ${TRANSFER_VERSION}, entries });
  if (entries.length > ${MAX_TRANSFER_ENTRIES} || size(text) > ${MAX_TRANSFER_BYTES}) throw new Error("Export exceeds local file limit; no storage was changed.");
  const url = URL.createObjectURL(new Blob([text], { type: "application/json;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "teka-edu-progression.json";
  document.body.append(link);
  try { link.click(); }
  finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
  return { downloadStarted: true, exportedValues: entries.length, excludedInvalidValues: excluded };
})();
`;
}

/** No hosted script: the bookmark stores the same reviewed exporter as a javascript URL. */
export function localProgressExportBookmarklet(sessions: readonly TransferSession[]): string {
  return `javascript:${encodeURIComponent(localProgressExportConsole(sessions))}`;
}

export function localProgressBookmarkletPage(sessions: readonly TransferSession[]): string {
  const bookmarklet = localProgressExportBookmarklet(sessions);
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Exporter la progression depuis l’ancienne adresse — Teka Edu</title>
<style>body{font:18px/1.5 system-ui,sans-serif;max-width:44rem;margin:0 auto;padding:20px;color:#292524}textarea{box-sizing:border-box;width:100%;font:14px/1.5 monospace;padding:12px}button,a{display:inline-block;min-height:44px;margin:8px 8px 8px 0;padding:8px 14px}button{font:inherit}li{margin:12px 0}</style>
</head><body>
<h1>Exporter depuis l’ancienne adresse</h1>
<p>Ce signet contient l’exporteur local Teka Edu. Il lit seulement la progression des séances connues, ne change rien dans le navigateur et ne contacte aucun service.</p>
<ol>
<li>Créez un signet pour une page ordinaire dans le navigateur contenant votre progression.</li>
<li>Copiez le code ci-dessous. Modifiez le signet : nommez-le « Export Teka » et remplacez son adresse par ce code complet, avec « javascript: » au début.</li>
<li>Ouvrez l’ancienne application dans le même navigateur et le même profil. Choisissez « Export Teka » dans vos signets.</li>
<li>Gardez le fichier « teka-edu-progression.json » téléchargé. Importez-le depuis la page « Transférer ma progression » de la nouvelle application.</li>
</ol>
<p>Sur un ordinateur, vous pouvez aussi glisser ce lien vers la barre de signets : <a href="${bookmarklet}">Export Teka</a></p>
<label for="bookmarklet">Adresse complète du signet</label>
<textarea id="bookmarklet" readonly rows="6" spellcheck="false">${bookmarklet}</textarea>
<button id="copy" type="button">Copier l’adresse du signet</button>
<p id="status" role="status" aria-live="polite"></p>
<p>Si la copie ne fonctionne pas, sélectionnez et copiez tout le texte. Un navigateur peut refuser un signet JavaScript ou un téléchargement. Ne supprimez aucune donnée de l’ancien navigateur. Les essais sur appareils physiques restent à faire.</p>
<script>
document.getElementById("copy").addEventListener("click", async () => {
  const field = document.getElementById("bookmarklet");
  const status = document.getElementById("status");
  try { await navigator.clipboard.writeText(field.value); status.textContent = "Adresse copiée."; }
  catch { field.focus(); field.select(); status.textContent = "Sélectionnez et copiez toute l’adresse du signet."; }
});
</script>
</body></html>
`;
}
