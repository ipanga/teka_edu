"use client";

import { useState, type ChangeEvent } from "react";
import {
  exportSessionTransfer,
  importSessionTransfer,
  parseSessionTransfer,
  MAX_TRANSFER_BYTES,
  type SessionTransfer,
  type TransferSession,
} from "@/lib/programme/session-transfer";

function download(transfer: SessionTransfer, filename: string): boolean {
  let url: string | undefined;
  let link: HTMLAnchorElement | undefined;
  try {
    const blob = new Blob([JSON.stringify(transfer)], { type: "application/json;charset=utf-8" });
    url = URL.createObjectURL(blob);
    link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    return true;
  } catch {
    return false;
  } finally {
    link?.remove();
    if (url) setTimeout(() => URL.revokeObjectURL(url!), 60_000);
  }
}

const buttonClass =
  "min-h-11 rounded-xl bg-emerald-700 px-5 py-3 text-lg font-semibold text-white disabled:bg-stone-300 disabled:text-stone-600";

export function ProgressTransfer({ sessions }: { sessions: readonly TransferSession[] }) {
  const [selected, setSelected] = useState<SessionTransfer | null>(null);
  const [status, setStatus] = useState("");
  const [reading, setReading] = useState(false);

  const exportFile = () => {
    try {
      const result = exportSessionTransfer(window.localStorage, sessions);
      if (!result.ok) {
        setStatus(
          "Impossible de lire la progression. Le stockage de ce navigateur est indisponible ou le fichier serait trop grand.",
        );
        return;
      }
      setStatus(
        download(result.transfer, "teka-edu-progression.json")
          ? `Téléchargement lancé : ${result.transfer.entries.length} valeurs. ${result.excludedEntries} valeurs invalides ont été écartées. Vérifiez que le fichier est enregistré.`
          : "Le téléchargement n’a pas pu démarrer. Réessayez dans un navigateur autorisant les téléchargements.",
      );
    } catch {
      setStatus("Le stockage de ce navigateur est indisponible. Aucun fichier n’a été créé.");
    }
  };

  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelected(null);
    setStatus("");
    if (!file) return;
    if (file.size > MAX_TRANSFER_BYTES) {
      setStatus("Ce fichier dépasse la limite de 1 Mo. Aucune progression n’a été modifiée.");
      return;
    }
    setReading(true);
    try {
      const result = parseSessionTransfer(await file.text(), sessions);
      if (!result.ok) {
        setStatus(
          "Ce fichier n’est pas un export de progression compatible et valide. Aucune progression n’a été modifiée.",
        );
        return;
      }
      setSelected(result.transfer);
      setStatus(
        `Fichier validé : ${result.transfer.entries.length} valeurs à examiner. Prêt à importer.`,
      );
    } catch {
      setStatus("Ce fichier n’a pas pu être lu. Aucune progression n’a été modifiée.");
    } finally {
      setReading(false);
    }
  };

  const importFile = () => {
    if (!selected) return;
    try {
      const result = importSessionTransfer(selected, sessions, window.localStorage, (backup) =>
        download(backup, "teka-edu-avant-import.json"),
      );
      if (result.status === "imported") {
        window.dispatchEvent(new Event("teka-session-change"));
        setStatus(
          `Import terminé : ${result.importedSessions} séances ajoutées (${result.importedEntries} valeurs). ${result.skippedSessions} séances déjà présentes conservées. Vérifiez que la sauvegarde avant import est enregistrée.`,
        );
      } else {
        const messages = {
          invalid: "Ce fichier n’est plus valide. Aucune progression n’a été modifiée.",
          storage_unavailable: "Le stockage est indisponible. Aucune progression n’a été ajoutée.",
          backup_failed:
            "La sauvegarde avant import n’a pas pu être créée et téléchargée. L’import n’a pas commencé.",
          rolled_back:
            "Le stockage a refusé l’import. Les valeurs ajoutées ont été retirées ; la progression précédente est conservée.",
          rollback_failed:
            "Le stockage a interrompu l’import et son annulation. Certaines valeurs peuvent avoir été ajoutées. Gardez la sauvegarde avant import et réessayez dans un navigateur avec du stockage disponible.",
        };
        setStatus(messages[result.status]);
      }
    } catch {
      setStatus("Le stockage de ce navigateur est indisponible. L’import n’a pas commencé.");
    }
  };

  return (
    <>
      <p className="rounded-xl bg-amber-50 p-4 text-base">
        La progression et les observations restent dans ce navigateur. Le fichier est créé et lu sur
        votre appareil ; rien n’est envoyé. Conservez-le dans un endroit privé.
      </p>
      <section
        aria-labelledby="export-progress"
        className="flex flex-col items-start gap-3 rounded-xl border border-stone-200 p-4 sm:p-5"
      >
        <h2 id="export-progress" className="text-xl font-semibold">
          1. Enregistrer un fichier
        </h2>
        <p className="text-base text-stone-600">
          Ouvrez cette page dans le navigateur qui contient votre progression, puis téléchargez le
          fichier.
        </p>
        <button type="button" onClick={exportFile} className={buttonClass}>
          Télécharger ma progression
        </button>
      </section>
      <section
        aria-labelledby="import-progress"
        className="flex flex-col items-start gap-3 rounded-xl border border-stone-200 p-4 sm:p-5"
      >
        <h2 id="import-progress" className="text-xl font-semibold">
          2. Retrouver les séances
        </h2>
        <p className="text-base text-stone-600">
          Dans le nouveau navigateur, choisissez le fichier. Toute séance déjà enregistrée ici sera
          conservée intégralement. Fermez les autres onglets Teka Edu avant l’import. Une sauvegarde
          de la progression actuelle sera téléchargée avant l’import.
        </p>
        <label className="flex w-full min-w-0 flex-col gap-2 text-base font-medium">
          Choisir un fichier de progression JSON
          <input
            type="file"
            accept=".json,application/json"
            onChange={readFile}
            disabled={reading}
            className="min-h-11 w-full min-w-0 rounded-lg border border-stone-300 p-2 text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2"
          />
        </label>
        <button
          type="button"
          onClick={importFile}
          disabled={!selected || reading}
          className={buttonClass}
        >
          Sauvegarder et importer
        </button>
      </section>
      <p role="status" aria-live="polite" className="text-base text-stone-700">
        {reading ? "Lecture du fichier…" : status}
      </p>
    </>
  );
}
