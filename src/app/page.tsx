import Link from "next/link";
import { listReviews } from "@/lib/store";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Home() {
  const reviews = await listReviews();

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Corrector de Carruseles</h1>
          <p className="text-zinc-500 mt-1">
            Subí las placas del carrusel y chequeá que no tengan errores de ortografía contra el brief.
          </p>
        </div>
        <Link
          href="/nueva"
          className="shrink-0 rounded-lg bg-zinc-900 text-white px-4 py-2.5 font-medium hover:bg-zinc-700 transition-colors"
        >
          + Nueva revisión
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center text-zinc-500">
          Todavía no hay revisiones. Creá la primera con el botón de arriba.
        </div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => {
            const errorCount = review.slides.reduce((acc, s) => acc + (s.errores?.length ?? 0), 0);
            const pending = review.slides.filter((s) => s.status === "analizando").length;
            return (
              <li key={review.id}>
                <Link
                  href={`/revision/${review.id}`}
                  className="block rounded-xl border border-zinc-200 bg-white px-5 py-4 hover:border-zinc-400 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-medium">{review.title}</h2>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        {formatDate(review.createdAt)} · {review.slides.length} placa(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {pending > 0 && (
                        <span className="text-xs font-medium rounded-full bg-amber-100 text-amber-700 px-2.5 py-1">
                          Analizando ({pending})
                        </span>
                      )}
                      {errorCount > 0 ? (
                        <span className="text-xs font-medium rounded-full bg-red-100 text-red-700 px-2.5 py-1">
                          {errorCount} error{errorCount === 1 ? "" : "es"}
                        </span>
                      ) : (
                        pending === 0 &&
                        review.slides.length > 0 && (
                          <span className="text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1">
                            Sin errores
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
