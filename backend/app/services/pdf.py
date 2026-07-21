from io import BytesIO
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.schemas import DiagnosisResult


def build_diagnosis_pdf(result: DiagnosisResult) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm)
    styles = getSampleStyleSheet()
    title = ParagraphStyle("TitleAG", parent=styles["Heading1"], textColor=colors.HexColor("#1B5E20"))
    body = ParagraphStyle("BodyAG", parent=styles["BodyText"], leading=16)

    story = [
        Paragraph("AgroGuardian AI — Reporte de diagnóstico", title),
        Spacer(1, 0.4 * cm),
        Paragraph(f"<b>ID:</b> {result.id}", body),
        Paragraph(f"<b>Fecha:</b> {result.created_at.strftime('%Y-%m-%d %H:%M')}", body),
        Spacer(1, 0.5 * cm),
        Paragraph("<b>Detección</b>", styles["Heading2"]),
        Paragraph(
            f"Cultivo: {result.detection.crop}<br/>"
            f"Enfermedad: {result.detection.disease}<br/>"
            f"Confianza: {result.detection.confidence * 100:.0f}%<br/>"
            f"Riesgo: {result.detection.risk_level.value.upper()}<br/>"
            f"Parte afectada: {result.detection.affected_part}",
            body,
        ),
        Spacer(1, 0.4 * cm),
        Paragraph("<b>Diagnóstico</b>", styles["Heading2"]),
        Paragraph(result.diagnosis.replace("\n", "<br/>"), body),
        Spacer(1, 0.4 * cm),
        Paragraph("<b>Clima</b>", styles["Heading2"]),
        Paragraph(
            f"{result.weather.location} — {result.weather.condition}<br/>"
            f"Temp: {result.weather.temperature_c}°C · Humedad: {result.weather.humidity_pct}% · "
            f"Lluvia: {result.weather.rain_mm} mm · Riesgo climático: {result.weather.climate_risk.value}",
            body,
        ),
        Spacer(1, 0.4 * cm),
        Paragraph("<b>Recomendaciones</b>", styles["Heading2"]),
    ]

    rows = [["#", "Acción", "Plazo"]]
    for i, rec in enumerate(result.recommendations, start=1):
        rows.append([str(i), f"{rec.title}: {rec.detail}", rec.timeframe])

    table = Table(rows, colWidths=[1.2 * cm, 11 * cm, 3.5 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E7D32")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph("<b>Plan de seguimiento</b>", styles["Heading2"]))
    story.append(
        Paragraph(
            f"Revisión en {result.follow_up.check_in_hours}h.<br/>"
            + "<br/>".join(f"• {s}" for s in result.follow_up.steps),
            body,
        )
    )
    story.append(Spacer(1, 0.8 * cm))
    story.append(
        Paragraph(
            f"Generado por AgroGuardian AI · {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC",
            ParagraphStyle("Footer", parent=body, textColor=colors.grey, fontSize=8),
        )
    )

    doc.build(story)
    return buffer.getvalue()
