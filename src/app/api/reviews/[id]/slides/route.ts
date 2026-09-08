import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getReview, saveImage, updateReview } from "@/lib/store";
import { analyzeSlide } from "@/lib/analyze";
import type { Slide } from "@/lib/types";

export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const review = await getReview(id);
    if (!review) {
      return NextResponse.json({ error: "Revisión no encontrada." }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta el archivo de imagen." }, { status: 400 });
    }

    if (file.type !== "image/png") {
      return NextResponse.json({ error: "Solo se aceptan archivos PNG." }, { status: 400 });
    }

    const slideId = nanoid(10);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const imageUrl = await saveImage(id, slideId, buffer, file.type);

    const baseSlide: Omit<Slide, "status"> = {
      id: slideId,
      filename: file.name,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    // OCR.space responde en 1-2s, así que analizamos antes de tocar la
    // base de datos y hacemos un único updateReview al final. Antes había
    // dos escrituras separadas (placa "analizando" y luego el resultado),
    // y cada updateReview vuelve a leer la base entera desde Vercel Blob:
    // esa segunda lectura podía llegar antes de que la primera escritura
    // se propagara, pisándola y perdiendo la placa recién subida.
    let finalSlide: Slide;
    try {
      const result = await analyzeSlide(review.brief, buffer);
      finalSlide = {
        ...baseSlide,
        status: "listo",
        transcripcion: result.transcripcion,
        errores: result.errores,
      };
    } catch (err) {
      finalSlide = {
        ...baseSlide,
        status: "error",
        errorMensaje: err instanceof Error ? err.message : "Error desconocido al analizar la imagen.",
      };
    }

    const updated = await updateReview(id, (r) => ({
      ...r,
      slides: [...r.slides, finalSlide],
    }));

    return NextResponse.json({ review: updated, slide: finalSlide });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al subir la placa." },
      { status: 500 }
    );
  }
}
