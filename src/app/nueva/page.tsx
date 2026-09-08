"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function NuevaRevisionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!brief.trim()) {
      setError("Pegá el texto del brief antes de continuar.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, brief }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear la revisión.");
      router.push(`/revision/${data.review.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-12">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Volver
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mt-3 mb-1">Nueva revisión</h1>
      <p className="text-zinc-500 mb-8">
        Pegá el texto del brief de contenido del panel del cliente. Después vas a poder subir las
        placas del carrusel (PNG) para chequear la ortografía.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="title">
            Título de la pieza
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Ej: "Tao Power — C1 Qué es TAO Power"'
            className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="brief">
            Texto del brief
          </label>
          <textarea
            id="brief"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Pegá acá el copy de cada placa tal como está en el panel de contenido..."
            rows={12}
            className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-zinc-900 text-white px-4 py-2.5 font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Creando..." : "Crear revisión y subir placas"}
        </button>
      </form>
    </main>
  );
}
