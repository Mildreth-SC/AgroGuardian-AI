import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import type { DiagnosisResult } from "@/types/api";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function drawLines(
  page: PDFPage,
  font: PDFFont,
  lines: string[],
  x: number,
  y: number,
  size: number,
  color = rgb(0.07, 0.13, 0.09)
) {
  let cursor = y;
  for (const line of lines) {
    page.drawText(line, { x, y: cursor, size, font, color });
    cursor -= size + 4;
  }
  return cursor;
}

function drawSection(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  title: string,
  body: string,
  x: number,
  y: number
): number {
  page.drawText(title, { x, y, size: 12, font: fontBold, color: rgb(0.11, 0.27, 0.2) });
  let cursor = y - 18;
  const lines = wrapText(body, font, 10, CONTENT_W);
  cursor = drawLines(page, font, lines, x, cursor, 10);
  return cursor - 10;
}

export async function buildDiagnosisPdf(
  result: DiagnosisResult,
  imageBytes?: Buffer | null
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`AgroGuardian — ${result.detection.disease}`);
  doc.setAuthor("AgroGuardian AI");
  doc.setSubject("Reporte de diagnóstico fitosanitario");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  page.drawRectangle({
    x: 0,
    y: PAGE_H - 72,
    width: PAGE_W,
    height: 72,
    color: rgb(0.18, 0.42, 0.31),
  });
  page.drawText("AgroGuardian AI", {
    x: MARGIN,
    y: PAGE_H - 42,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Reporte de diagnóstico fitosanitario", {
    x: MARGIN,
    y: PAGE_H - 58,
    size: 10,
    font,
    color: rgb(0.9, 0.95, 0.92),
  });

  y = PAGE_H - 88;
  const meta = `ID: ${result.id.slice(0, 8)}…  ·  Fecha: ${new Date(result.created_at).toLocaleString("es-EC")}`;
  y = drawSection(page, font, fontBold, "Identificación", meta, MARGIN, y);

  if (imageBytes && imageBytes.length > 100) {
    try {
      const isJpeg = imageBytes[0] === 0xff && imageBytes[1] === 0xd8;
      const isPng =
        imageBytes[0] === 0x89 && imageBytes[1] === 0x50 && imageBytes[2] === 0x4e;
      const embedded = isJpeg
        ? await doc.embedJpg(imageBytes)
        : isPng
          ? await doc.embedPng(imageBytes)
          : await doc.embedJpg(imageBytes);
      const dims = embedded.scale(1);
      const maxW = CONTENT_W;
      const maxH = 180;
      const scale = Math.min(maxW / dims.width, maxH / dims.height, 1);
      const w = dims.width * scale;
      const h = dims.height * scale;
      if (y - h < MARGIN + 80) {
        page = doc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - MARGIN;
      }
      page.drawText("Imagen analizada", {
        x: MARGIN,
        y,
        size: 12,
        font: fontBold,
        color: rgb(0.11, 0.27, 0.2),
      });
      y -= 16;
      page.drawImage(embedded, { x: MARGIN, y: y - h, width: w, height: h });
      y -= h + 14;
    } catch {
      /* optional image */
    }
  }

  const det = result.detection;
  const detectionBody = [
    `Cultivo: ${det.crop}`,
    `Enfermedad: ${det.disease}`,
    `Confianza: ${Math.round(det.confidence * 100)}%`,
    `Riesgo: ${det.risk_level.toUpperCase()}`,
    `Parte afectada: ${det.affected_part}`,
    det.rationale ? `Señales: ${det.rationale}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (y < MARGIN + 120) {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }
  y = drawSection(page, font, fontBold, "Detección", detectionBody, MARGIN, y);

  if (det.alternatives?.length) {
    const altBody = det.alternatives
      .map((a) => `• ${a.disease} (${Math.round(a.confidence * 100)}%)`)
      .join("\n");
    y = drawSection(page, font, fontBold, "Diagnósticos alternativos", altBody, MARGIN, y);
  }

  if (y < MARGIN + 100) {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }
  y = drawSection(page, font, fontBold, "Diagnóstico agronómico", result.diagnosis, MARGIN, y);

  const w = result.weather;
  const weatherBody = `${w.location} — ${w.condition}\nTemp: ${w.temperature_c}°C · Humedad: ${w.humidity_pct}% · Lluvia: ${w.rain_mm} mm · Viento: ${w.wind_kmh} km/h\nRiesgo climático: ${w.climate_risk.toUpperCase()}`;
  if (y < MARGIN + 80) {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }
  y = drawSection(page, font, fontBold, "Contexto climático", weatherBody, MARGIN, y);

  if (y < MARGIN + 140) {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }
  page.drawText("Recomendaciones", {
    x: MARGIN,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.11, 0.27, 0.2),
  });
  y -= 18;
  result.recommendations.forEach((rec, i) => {
    const block = `${i + 1}. ${rec.title} (${rec.timeframe})\n${rec.detail}`;
    const lines = wrapText(block, font, 9, CONTENT_W);
    if (y - lines.length * 13 < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
    y = drawLines(page, font, lines, MARGIN, y, 9);
    y -= 6;
  });

  const followBody = `Revisión sugerida en ${result.follow_up.check_in_hours} h.\n${result.follow_up.steps.map((s) => `• ${s}`).join("\n")}`;
  if (y < MARGIN + 80) {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }
  y = drawSection(page, font, fontBold, "Plan de seguimiento", followBody, MARGIN, y);

  const disclaimer =
    "Este reporte es orientativo y no sustituye la validación de un agrónomo o extensionista. Las decisiones de tratamiento deben confirmarse con normativa local (MAG/INIAP).";
  if (y < MARGIN + 60) {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }
  drawSection(page, font, fontBold, "Aviso legal", disclaimer, MARGIN, y);

  const pages = doc.getPages();
  const last = pages[pages.length - 1];
  last.drawText(`Generado por AgroGuardian AI · ${new Date().toISOString().slice(0, 16)} UTC`, {
    x: MARGIN,
    y: 28,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  return doc.save();
}
