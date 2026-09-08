import nspell from "nspell";
import dictionaryEs from "dictionary-es";
import type { SpellIssue } from "./types";

type Speller = ReturnType<typeof nspell>;

let baseSpeller: Speller | null = null;

function getBaseSpeller(): Speller {
  if (!baseSpeller) {
    baseSpeller = nspell({
      aff: Buffer.from(dictionaryEs.aff),
      dic: Buffer.from(dictionaryEs.dic),
    });
  }
  return baseSpeller;
}

const WORD_RE = /[A-Za-zÀ-ÖØ-öø-ÿÑñ][A-Za-zÀ-ÖØ-öø-ÿÑñ'-]*/g;
const VOWELS: Record<string, string> = { a: "á", e: "é", i: "í", o: "ó", u: "ú" };

function tokenize(text: string): string[] {
  return text.match(WORD_RE) ?? [];
}

function shouldSkip(word: string): boolean {
  if (word.length <= 1) return true;
  if (/^(https?:\/\/|www\.)/i.test(word)) return true;
  if (/^\d+$/.test(word)) return true;
  return false;
}

// Detecta si agregando una sola tilde a alguna vocal la palabra pasa a ser correcta.
function missingAccentSuggestion(word: string, speller: Speller): string | null {
  const lower = word.toLowerCase();
  for (let i = 0; i < lower.length; i++) {
    const accented = VOWELS[lower[i]];
    if (!accented) continue;
    const candidate = lower.slice(0, i) + accented + lower.slice(i + 1);
    if (speller.correct(candidate)) return candidate;
  }
  return null;
}

function buildContext(fullText: string, word: string): string {
  const idx = fullText.indexOf(word);
  if (idx === -1) return word;
  const start = Math.max(0, idx - 25);
  const end = Math.min(fullText.length, idx + word.length + 25);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < fullText.length ? "…" : "";
  return `${prefix}${fullText.slice(start, end).replace(/\s+/g, " ").trim()}${suffix}`;
}

export function checkSpelling(transcription: string, brief: string): SpellIssue[] {
  const speller = getBaseSpeller();

  // Términos del brief (nombres propios, marcas, hashtags) se consideran correctos
  // aunque no estén en el diccionario estándar.
  const briefWords = new Set(tokenize(brief).map((w) => w.toLowerCase()));

  const seen = new Set<string>();
  const errors: SpellIssue[] = [];

  for (const rawWord of tokenize(transcription)) {
    if (shouldSkip(rawWord)) continue;

    const key = rawWord.toLowerCase();
    if (seen.has(key)) continue;

    if (briefWords.has(key)) continue;
    if (speller.correct(rawWord) || speller.correct(key)) continue;

    seen.add(key);

    const accentFix = missingAccentSuggestion(rawWord, speller);
    const suggestions = speller.suggest(rawWord);
    const sugerencia = accentFix ?? suggestions[0] ?? "(sin sugerencia)";
    const motivo = accentFix
      ? "Posible tilde faltante o mal puesta."
      : "No se reconoce como palabra válida en español.";

    errors.push({
      palabra: rawWord,
      contexto: buildContext(transcription, rawWord),
      sugerencia,
      motivo,
    });
  }

  return errors;
}
