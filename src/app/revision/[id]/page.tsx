"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Review, Slide } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ slide }: { slide: Slide }) {
  if (slide.status === "analizando") {
    return (
      <span className="text-xs font-medium rounded-full bg-amber-100 text-amber-700 px-2.5 py-1">
        Analizando…
      </span>
    );
  }
  if (slide.status === "error") {
    return (
      <span className="text-xs font-medium rounded-full bg-red-100 text-red-700 px-2.5 py-1">
        Error al analizar
      </span>
    );
  }
  const count = slide.errores?.length ?? 0;
  if (count > 0) {
    return (
      <span className="text-xs font-medium rounded-full bg-red-100 text-red-700 px-2.5 py-1">
        {count} error{count === 1 ? "" : "es"} de ortografía
      </span>
    );
  }
  return (
    <span className="text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1">
      Sin errores
    </span>
  );
}

export default function RevisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchReview = useCallback(async () => {
    const res = await fetch(`/api/reviews/${id}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setReview(data.review);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  useEffect(() => {
    const hasPending = review?.slides.some((s) => s.status === "analizando");
    if (hasPending && !pollRef.current) {
      pollRef.current = setInterval(fetchReview, 3000);
    }
    if (!hasPending && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [review, fetchReview]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const pngFiles = Array.from(files).filter((f) => f.type === "image/png");
    if (pngFiles.length !== files.length) {
      setUploadError("Solo se aceptan archivos PNG. Se ignoraron los demás formatos.");
    }
    if (pngFiles.length === 0) return;

    setUploading(true);
    for (const file of pngFiles) {
      try {
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch(`/api/reviews/${id}/slides`, { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `No se pudo subir ${file.name}`);
        setReview(data.review);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Error al subir la imagen.");
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (loading) {
    return <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 text-zinc-500">Cargando…</main>;
  }

  if (!review) {
    return (
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12">
        <p className="text-red-600">No se encontró la revisión.</p>
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Volver
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Volver
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mt-3 mb-1">{review.title}</h1>
      <p className="text-zinc-500 mb-6">Creada el {formatDate(review.createdAt)}</p>

      <details className="mb-8 rounded-xl border border-zinc-200 bg-white px-5 py-4">
        <summary className="cursor-pointer font-medium">Ver texto del brief</summary>
        <pre className="whitespace-pre-wrap text-sm text-zinc-600 mt-3 font-sans">{review.brief}</pre>
      </details>

      <div className="rounded-xl border-2 border-dashed border-zinc-300 bg-white px-5 py-6 mb-8 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png"
          multiple
          className="hidden"
          id="file-upload"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <label
          htmlFor="file-upload"
          className="inline-block cursor-pointer rounded-lg bg-zinc-900 text-white px-4 py-2.5 font-medium hover:bg-zinc-700 transition-colors"
        >
          {uploading ? "Subiendo y analizando…" : "+ Subir placas del carrusel (PNG)"}
        </label>
        <p className="text-xs text-zinc-500 mt-2">Podés seleccionar varias imágenes a la vez.</p>
        {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
      </div>

      {review.slides.length === 0 ? (
        <p className="text-zinc-500 text-center py-8">Todavía no subiste ninguna placa.</p>
      ) : (
        <ul className="space-y-4">
          {review.slides.map((slide, i) => (
            <li key={slide.id} className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex gap-5">
                <div className="shrink-0 w-32 h-32 relative rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                  <Image src={slide.imageUrl} alt={slide.filename} fill className="object-contain" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="font-medium truncate">
                      Placa {i + 1} · {slide.filename}
                    </h3>
                    <StatusBadge slide={slide} />
                  </div>

                  {slide.status === "error" && (
                    <p className="text-sm text-red-600">{slide.errorMensaje}</p>
                  )}

                  {slide.status === "listo" && (
                    <>
                      {slide.transcripcion && (
                        <p className="text-sm text-zinc-500 italic mb-3">
                          &ldquo;{slide.transcripcion}&rdquo;
                        </p>
                      )}
                      {slide.errores && slide.errores.length > 0 && (
                        <ul className="space-y-2">
                          {slide.errores.map((err, idx) => (
                            <li key={idx} className="text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                              <span className="font-semibold text-red-700 line-through">{err.palabra}</span>
                              {" → "}
                              <span className="font-semibold text-emerald-700">{err.sugerencia}</span>
                              <p className="text-zinc-600 mt-0.5">{err.motivo}</p>
                              <p className="text-zinc-400 text-xs mt-0.5">Contexto: “{err.contexto}”</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
