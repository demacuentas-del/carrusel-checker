export type SlideStatus = "pendiente" | "analizando" | "listo" | "error";

export interface SpellIssue {
  palabra: string;
  contexto: string;
  sugerencia: string;
  motivo: string;
}

export interface Slide {
  id: string;
  filename: string;
  imageUrl: string;
  status: SlideStatus;
  transcripcion?: string;
  errores?: SpellIssue[];
  errorMensaje?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  title: string;
  brief: string;
  createdAt: string;
  slides: Slide[];
}

export interface ReviewSummary {
  id: string;
  title: string;
  createdAt: string;
  slideCount: number;
  errorCount: number;
  pendingCount: number;
}

export interface Db {
  reviews: Review[];
}
