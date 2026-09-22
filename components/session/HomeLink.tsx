import Link from "next/link";

/**
 * Back to the class choice, from anywhere a parent might be (ADR-044). Deliberately absent from
 * the child's full-screen view: a mis-tap there should never end the activity.
 */
export function HomeLink({ label = "Accueil" }: { label?: string }) {
  return (
    <Link
      href="/"
      className="flex w-fit items-center gap-2 text-base font-medium text-emerald-800 underline"
    >
      <span aria-hidden="true">←</span> {label}
    </Link>
  );
}
