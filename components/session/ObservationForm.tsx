"use client";

import { useState } from "react";

/**
 * After a real session: what actually happened (docs/REAL_SESSION_TESTING.md).
 *
 * This records **how the session went**, never who it was with. There is no child name, no age,
 * no school, no identifier of any kind — the form does not ask, and the notes it produces say so.
 * Everything stays in this browser until the tester copies it out deliberately; nothing is sent
 * anywhere, and nothing reaches Supabase (ADR-006).
 *
 * It answers usability questions. It is **not** pedagogical review: whether the objectives,
 * progression and expectations are right is decided by the review gate, on a generated package,
 * not by watching one session (ADR-047).
 */

type Scale = "" | "oui" | "en-partie" | "non";
type Level = "" | "trop-facile" | "juste" | "trop-difficile";

const SCALE: { value: Scale; label: string }[] = [
  { value: "oui", label: "Oui" },
  { value: "en-partie", label: "En partie" },
  { value: "non", label: "Non" },
];

const LEVELS: { value: Level; label: string }[] = [
  { value: "trop-facile", label: "Trop facile" },
  { value: "juste", label: "Juste" },
  { value: "trop-difficile", label: "Trop difficile" },
];

const storageKey = (day: number) => `teka-edu.observation.${day}`;

function Choice<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-base font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`rounded-xl border-2 px-4 py-2 text-base ${
              value === option.value
                ? "border-emerald-700 bg-emerald-50 font-semibold"
                : "border-stone-300"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function ObservationForm({
  day,
  dateLabel,
  plannedMinutes,
}: {
  day: number;
  dateLabel: string;
  plannedMinutes: number;
}) {
  const [actualMinutes, setActualMinutes] = useState("");
  const [guidanceClear, setGuidanceClear] = useState<Scale>("");
  const [improvised, setImprovised] = useState<Scale>("");
  const [preparationEasy, setPreparationEasy] = useState<Scale>("");
  const [engaged, setEngaged] = useState<Scale>("");
  const [understoodFrench, setUnderstoodFrench] = useState<Scale>("");
  const [neededEnglish, setNeededEnglish] = useState<Scale>("");
  const [difficulty, setDifficulty] = useState<Level>("");
  const [tired, setTired] = useState<Scale>("");
  const [wantedVisuals, setWantedVisuals] = useState<Scale>("");
  const [technical, setTechnical] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const report = [
    `# Séance testée — jour ${day}, ${dateLabel}`,
    "",
    `- Durée prévue : ${plannedMinutes} min`,
    `- Durée réelle : ${actualMinutes || "—"} min`,
    "",
    "## Parent",
    `- Guidance claire : ${guidanceClear || "—"}`,
    `- A dû improviser : ${improvised || "—"}`,
    `- Préparation facile : ${preparationEasy || "—"}`,
    "",
    "## Enfant",
    `- Est resté engagé : ${engaged || "—"}`,
    `- A compris les consignes en français : ${understoodFrench || "—"}`,
    `- A eu besoin de l’aide en anglais : ${neededEnglish || "—"}`,
    `- Niveau : ${difficulty || "—"}`,
    `- A montré de la fatigue : ${tired || "—"}`,
    `- Aurait voulu plus d’images : ${wantedVisuals || "—"}`,
    "",
    "## Technique",
    technical.trim() === "" ? "- Rien à signaler" : technical.trim(),
    "",
    "## Notes",
    notes.trim() === "" ? "—" : notes.trim(),
    "",
    "_Test d’usage. Ce n’est pas une relecture pédagogique._",
  ].join("\n");

  const save = () => {
    try {
      window.localStorage.setItem(storageKey(day), report);
      setSaved(true);
    } catch {
      // A private window must not lose the tester's work silently: the text stays on screen.
      setSaved(false);
    }
  };

  return (
    <form className="flex flex-col gap-7" onSubmit={(event) => event.preventDefault()}>
      <p className="rounded-2xl bg-amber-50 px-5 py-4 text-base">
        Ces observations restent <strong>dans ce navigateur</strong>. Aucune information sur
        l’enfant n’est demandée ni enregistrée : ni prénom, ni âge, ni école. Rien n’est envoyé.
      </p>

      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">
          Durée réelle de la séance, en minutes (prévu : {plannedMinutes})
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={180}
          value={actualMinutes}
          onChange={(event) => setActualMinutes(event.target.value)}
          className="w-32 rounded-xl border-2 border-stone-300 px-4 py-2 text-lg"
        />
      </label>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Pour le parent</h2>
        <Choice
          legend="La guidance était-elle claire ?"
          options={SCALE}
          value={guidanceClear}
          onChange={setGuidanceClear}
        />
        <Choice
          legend="Avez-vous dû improviser ?"
          options={SCALE}
          value={improvised}
          onChange={setImprovised}
        />
        <Choice
          legend="La préparation était-elle facile ?"
          options={SCALE}
          value={preparationEasy}
          onChange={setPreparationEasy}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Pour l’enfant</h2>
        <Choice
          legend="Est-il resté engagé ?"
          options={SCALE}
          value={engaged}
          onChange={setEngaged}
        />
        <Choice
          legend="A-t-il compris les consignes en français ?"
          options={SCALE}
          value={understoodFrench}
          onChange={setUnderstoodFrench}
        />
        <Choice
          legend="A-t-il eu besoin de l’aide en anglais ?"
          options={SCALE}
          value={neededEnglish}
          onChange={setNeededEnglish}
        />
        <Choice
          legend="Le niveau était-il juste ?"
          options={LEVELS}
          value={difficulty}
          onChange={setDifficulty}
        />
        <Choice
          legend="A-t-il montré de la fatigue ?"
          options={SCALE}
          value={tired}
          onChange={setTired}
        />
        <Choice
          legend="Aurait-il voulu plus d’images ?"
          options={SCALE}
          value={wantedVisuals}
          onChange={setWantedVisuals}
        />
      </section>

      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">
          Problème technique : écran confus, interaction qui ne répond pas, souci sur téléphone ?
        </span>
        <textarea
          value={technical}
          onChange={(event) => setTechnical(event.target.value)}
          rows={3}
          className="rounded-xl border-2 border-stone-300 px-4 py-3 text-base"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Notes libres</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={5}
          className="rounded-xl border-2 border-stone-300 px-4 py-3 text-base"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="rounded-2xl bg-emerald-700 px-6 py-3 text-lg font-semibold text-white"
        >
          Enregistrer dans ce navigateur
        </button>
        {saved && (
          <span role="status" className="text-base font-medium text-emerald-800">
            Enregistré.
          </span>
        )}
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">À copier</h2>
        <p className="text-base text-stone-600">
          Copiez ce texte dans le dépôt ou dans un message : c’est la trace du test.
        </p>
        <textarea
          readOnly
          value={report}
          rows={16}
          aria-label="Compte rendu de la séance testée"
          className="rounded-xl border-2 border-stone-300 bg-white px-4 py-3 font-mono text-sm"
        />
      </section>
    </form>
  );
}
