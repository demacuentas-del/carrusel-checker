import { NextResponse } from "next/server";
import { getReview } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const review = await getReview(id);
  if (!review) {
    return NextResponse.json({ error: "Revisión no encontrada." }, { status: 404 });
  }
  return NextResponse.json({ review });
}
