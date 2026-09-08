import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createReview, listReviews } from "@/lib/store";
import type { Review } from "@/lib/types";

export async function GET() {
  const reviews = await listReviews();
  const summaries = reviews.map((r) => ({
    id: r.id,
    title: r.title,
    createdAt: r.createdAt,
    slideCount: r.slides.length,
    errorCount: r.slides.reduce((acc, s) => acc + (s.errores?.length ?? 0), 0),
    pendingCount: r.slides.filter((s) => s.status === "analizando" || s.status === "pendiente").length,
  }));
  return NextResponse.json({ reviews: summaries });
}

export async function POST(req: Request) {
  const body = await req.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const brief = typeof body.brief === "string" ? body.brief.trim() : "";

  if (!brief) {
    return NextResponse.json({ error: "El brief no puede estar vacío." }, { status: 400 });
  }

  const review: Review = {
    id: nanoid(10),
    title: title || "Revisión sin título",
    brief,
    createdAt: new Date().toISOString(),
    slides: [],
  };

  await createReview(review);
  return NextResponse.json({ review });
}
