# Corrector de Carruseles

App web para revisar la ortografía de las placas de un carrusel (PNG) contra el texto del brief de contenido.

## Cómo funciona

1. Creás una revisión y pegás el texto del brief (copiado desde el panel del cliente).
2. Subís las placas del carrusel en PNG.
3. Cada imagen pasa por OCR (Tesseract.js) para extraer el texto, y ese texto se corrige contra un diccionario de español (nspell + `dictionary-es`), señalando **únicamente errores de ortografía** (no errores de contenido/orden respecto al brief). Las palabras del brief (nombres propios, marcas, hashtags) se toman como correctas aunque no estén en el diccionario.
4. El resultado queda guardado y visible para cualquiera que entre a la URL de la revisión — pensado para que varias personas del equipo vean el estado del trabajo.

Todo el procesamiento (OCR + ortografía) corre local, sin API keys ni costos por uso.

## Desarrollo local

```bash
npm install
npm run dev
```

Abrí http://localhost:3000

En local, las imágenes subidas se guardan en `public/uploads/` y los datos en `data/index.json` (ambos ignorados por git). No hace falta configurar ninguna base de datos.

## Despliegue en Vercel

1. Subí este proyecto a un repositorio de GitHub.
2. Importalo en [vercel.com/new](https://vercel.com/new).
3. En el proyecto de Vercel, andá a **Storage → Create Database → Blob** y conectalo (esto agrega automáticamente la variable `BLOB_READ_WRITE_TOKEN`, necesaria para guardar las imágenes subidas — sin costo en el plan gratuito para este volumen de uso).
4. Deploy. Listo — la URL pública queda disponible para todo el equipo.
