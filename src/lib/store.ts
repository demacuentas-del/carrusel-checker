import fs from "node:fs";
import path from "node:path";
import type { Db, Review } from "./types";

const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const DB_PATHNAME = "db/index.json";
const LOCAL_DB_PATH = path.join(process.cwd(), "data", "index.json");
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

function emptyDb(): Db {
  return { reviews: [] };
}

async function readDb(): Promise<Db> {
  if (hasBlob) {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: DB_PATHNAME });
    const found = blobs.find((b) => b.pathname === DB_PATHNAME);
    if (!found) return emptyDb();
    const res = await fetch(found.url, { cache: "no-store" });
    if (!res.ok) return emptyDb();
    return (await res.json()) as Db;
  }

  if (!fs.existsSync(LOCAL_DB_PATH)) return emptyDb();
  const raw = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
  return raw.trim() ? (JSON.parse(raw) as Db) : emptyDb();
}

async function writeDb(db: Db): Promise<void> {
  if (hasBlob) {
    const { put } = await import("@vercel/blob");
    await put(DB_PATHNAME, JSON.stringify(db, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  try {
    fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2));
  } catch {
    throw new Error(
      "No se pudo guardar (el disco del servidor es de solo lectura en producción). Conectá Vercel Blob en Storage → Create Database → Blob y volvé a desplegar."
    );
  }
}

export async function saveImage(
  reviewId: string,
  slideId: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const pathname = `uploads/${reviewId}/${slideId}.png`;

  if (hasBlob) {
    const { put } = await import("@vercel/blob");
    const { url } = await put(pathname, buffer, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
    });
    return url;
  }

  try {
    const dir = path.join(LOCAL_UPLOADS_DIR, reviewId);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${slideId}.png`), buffer);
    return `/uploads/${reviewId}/${slideId}.png`;
  } catch {
    throw new Error(
      "No se pudo guardar la imagen (el disco del servidor es de solo lectura en producción). Conectá Vercel Blob en Storage → Create Database → Blob y volvé a desplegar."
    );
  }
}

export async function listReviews(): Promise<Review[]> {
  const db = await readDb();
  return [...db.reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getReview(id: string): Promise<Review | undefined> {
  const db = await readDb();
  return db.reviews.find((r) => r.id === id);
}

export async function createReview(review: Review): Promise<void> {
  const db = await readDb();
  db.reviews.unshift(review);
  await writeDb(db);
}

export async function updateReview(
  id: string,
  mutate: (review: Review) => Review
): Promise<Review | undefined> {
  const db = await readDb();
  const idx = db.reviews.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  db.reviews[idx] = mutate(db.reviews[idx]);
  await writeDb(db);
  return db.reviews[idx];
}

export const storageMode = hasBlob ? "vercel-blob" : "local-disk";
