import sharp from "sharp";

// OCR.space free tier caps uploads at 1MB. Carousel slides exported from
// design tools (Canva, Figma) commonly exceed that, so we downscale/recompress
// before sending. We keep PNG as long as possible (sharper text for OCR) and
// only fall back to JPEG if PNG alone can't get under the limit.
const OCR_SPACE_MAX_BYTES = 1024 * 1024;
const OCR_SPACE_URL = "https://api.ocr.space/parse/image";

async function prepareImageForOcr(imageBuffer: Buffer): Promise<{ buffer: Buffer; filename: string }> {
  if (imageBuffer.length <= OCR_SPACE_MAX_BYTES) {
    return { buffer: imageBuffer, filename: "slide.png" };
  }

  let width = (await sharp(imageBuffer).metadata()).width ?? 1600;

  // Try shrinking as PNG first.
  for (const targetWidth of [1600, 1200, 1000, 800]) {
    if (targetWidth >= width) continue;
    const resized = await sharp(imageBuffer)
      .resize({ width: targetWidth })
      .png({ compressionLevel: 9 })
      .toBuffer();
    if (resized.length <= OCR_SPACE_MAX_BYTES) {
      return { buffer: resized, filename: "slide.png" };
    }
    width = targetWidth;
  }

  // Still too big: fall back to JPEG, stepping down quality.
  for (const quality of [85, 70, 55, 40]) {
    const jpeg = await sharp(imageBuffer)
      .resize({ width: 1200 })
      .jpeg({ quality })
      .toBuffer();
    if (jpeg.length <= OCR_SPACE_MAX_BYTES) {
      return { buffer: jpeg, filename: "slide.jpg" };
    }
  }

  throw new Error(
    "La placa es demasiado pesada para analizarla incluso después de comprimirla. Probá exportarla en menor resolución."
  );
}

interface OcrSpaceResponse {
  ParsedResults?: { ParsedText: string }[];
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ErrorDetails?: string;
}

export async function extractText(imageBuffer: Buffer): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta configurar OCR_SPACE_API_KEY en las variables de entorno de Vercel."
    );
  }

  const { buffer, filename } = await prepareImageForOcr(imageBuffer);

  const formData = new FormData();
  formData.append("apikey", apiKey);
  formData.append("language", "spa");
  formData.append("OCREngine", "2");
  formData.append("scale", "true");
  formData.append(
    "file",
    new Blob([new Uint8Array(buffer)], { type: filename.endsWith(".jpg") ? "image/jpeg" : "image/png" }),
    filename
  );

  const res = await fetch(OCR_SPACE_URL, { method: "POST", body: formData });
  if (!res.ok) {
    throw new Error(`OCR.space respondió con error HTTP ${res.status}.`);
  }

  const data = (await res.json()) as OcrSpaceResponse;

  if (data.IsErroredOnProcessing) {
    const message = Array.isArray(data.ErrorMessage)
      ? data.ErrorMessage.join(" ")
      : data.ErrorMessage || data.ErrorDetails || "Error desconocido de OCR.space.";
    throw new Error(message);
  }

  const text = data.ParsedResults?.[0]?.ParsedText ?? "";
  return text.trim();
}
