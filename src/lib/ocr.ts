import path from "node:path";
import { createWorker, type Worker } from "tesseract.js";

// Bundled locally via the `@tesseract.js-data/spa` package instead of the
// tesseract.js default of fetching spa.traineddata.gz from the jsdelivr CDN
// on every cold start. That network round-trip (plus OCR itself) was blowing
// past Vercel's 60s function timeout. `4.0.0_best_int` is the variant used
// by tesseract.js's default OEM (LSTM_ONLY).
const LANG_PATH = path.join(
  process.cwd(),
  "node_modules/@tesseract.js-data/spa/4.0.0_best_int"
);

let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    const cachePath = process.env.VERCEL ? "/tmp" : undefined;
    workerPromise = createWorker("spa", undefined, {
      langPath: LANG_PATH,
      ...(cachePath ? { cachePath } : {}),
    });
  }
  return workerPromise;
}

export async function extractText(imageBuffer: Buffer): Promise<string> {
  const worker = await getWorker();
  const {
    data: { text },
  } = await worker.recognize(imageBuffer);
  return text.trim();
}
