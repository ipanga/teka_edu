import { HomeLink } from "@/components/session/HomeLink";
import { ProgressTransfer } from "@/components/session/ProgressTransfer";
import { transferSessions } from "@/lib/programme/session-catalogue";

export default function ProgressPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-6 sm:py-8">
      <header className="flex flex-col gap-2">
        <HomeLink />
        <h1 className="text-3xl font-bold">Transférer ma progression</h1>
        <p className="text-base text-stone-600">
          Gardez un fichier de vos séances pour les retrouver dans un autre navigateur ou sur un
          autre appareil.
        </p>
      </header>
      <ProgressTransfer sessions={transferSessions()} />
    </main>
  );
}
