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

    const pendingSlide: Slide = {
      id: slideId,
      filename: file.name,
      imageUrl,
      status: "analizando",
      createdAt: new Date().toISOString(),
    };

    await updateReview(id, (r) => ({ ...r, slides: [...r.slides, pendingSlide] }));

    let finalSlide: Slide;
    try {
      const result = await analyzeSlide(review.brief, buffer);
      finalSlide = {
        ...pendingSlide,
        status: "listo",
        transcripcion: result.transcripcion,
        errores: result.errores,
      };
    } catch (err) {
      finalSlide = {
        ...pendingSlide,
        status: "error",
        errorMensaje: err instanceof Error ? err.message : "Error desconocido al analizar la imagen.",
      };
    }

    const updated = await updateReview(id, (r) => ({
      ...r,
      slides: r.slides.map((s) => (s.id === slideId ? finalSlide : s)),
    }));

    return NextResponse.json({ review: updated, slide: finalSlide });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al subir la placa." },
      { status: 500 }
    );
  }
}
