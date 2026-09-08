import { createWorker, type Worker } from "tesseract.js";

let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    const cachePath = process.env.VERCEL ? "/tmp" : undefined;
    workerPromise = createWorker("spa", undefined, cachePath ? { cachePath } : undefined);
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
