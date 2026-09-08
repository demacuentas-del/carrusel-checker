import { extractText } from "./ocr";
import { checkSpelling } from "./spellcheck";
import type { SpellIssue } from "./types";

export interface AnalysisResult {
  transcripcion: string;
  errores: SpellIssue[];
}

export async function analyzeSlide(brief: string, imageBuffer: Buffer): Promise<AnalysisResult> {
  const transcripcion = await extractText(imageBuffer);
  const errores = checkSpelling(transcripcion, brief);
  return { transcripcion, errores };
}
