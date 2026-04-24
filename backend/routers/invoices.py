"""
Invoices Router
===============
Handles invoice generation, numbering, and email delivery.
All endpoints require HOD or Faculty role.
"""

import asyncio
import base64
import html as html_lib
import io
import logging
import os

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from typing import Dict
from datetime import date, datetime, timezone

# Load SJRI logo once at startup for inline embedding in email HTML.
# Emails cannot reference local file paths, so the image must be base64-encoded.
_LOGO_B64 = ""
_logo_path = os.path.join(
    os.path.dirname(__file__), "..", "..", "frontend", "public", "images", "logo", "sjrilogo.png"
)
try:
    with open(_logo_path, "rb") as _f:
        _LOGO_B64 = base64.b64encode(_f.read()).decode()
except FileNotFoundError:
    logging.getLogger(__name__).warning(
        "SJRI logo not found at %s — invoice emails will use text-only header.", _logo_path
    )

logger = logging.getLogger(__name__)

from schemas import InvoiceSend, InvoiceResponse
from routers.auth import is_hod_or_faculty
from utils.supabase_client import supabase, execute_query
from utils.limiter import limiter

router = APIRouter(prefix="/invoices", tags=["Invoices"])


# ============================================================================
# HELPERS
# ============================================================================

def _get_current_fy() -> str:
    """Return current Indian financial year string e.g. '2025-26'."""
    today = date.today()
    y = today.year
    if today.month >= 4:
        return f"{y}-{str(y + 1)[2:]}"
    return f"{y - 1}-{str(y)[2:]}"


async def _next_invoice_number() -> str:
    """Generate next sequential invoice number for the current financial year.

    Uses the DB-side ``get_next_invoice_number`` RPC which holds a
    PostgreSQL advisory lock for the duration of the call.  This prevents two
    concurrent requests from counting the same existing rows and producing the
    same serial number.  The ``invoices.invoice_number`` UNIQUE constraint
    provides a final safety net and surfaces any residual collision as a 500
    rather than silently issuing duplicate invoice numbers.
    """
    fy = _get_current_fy()
    result = await asyncio.to_thread(
        lambda: supabase.rpc("get_next_invoice_number", {"p_fy": fy}).execute()
    )
    return result.data


def _amount_in_words(amount: float) -> str:
    """Convert a numeric amount to Indian-system words (Crore/Lakh/Thousand)."""
    ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
            "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    def two_digits(n: int) -> str:
        if n < 20:
            return ones[n]
        return tens[n // 10] + (" " + ones[n % 10] if n % 10 else "")

    n = int(amount)
    if n == 0:
        return "Zero"
    parts = []
    if n >= 10_000_000:
        parts.append(two_digits(n // 10_000_000) + " Crore"); n %= 10_000_000
    if n >= 100_000:
        parts.append(two_digits(n // 100_000) + " Lakh"); n %= 100_000
    if n >= 1_000:
        parts.append(two_digits(n // 1_000) + " Thousand"); n %= 1_000
    if n >= 100:
        parts.append(ones[n // 100] + " Hundred"); n %= 100
    if n > 0:
        parts.append(two_digits(n))
    return "Rupees " + " ".join(parts) + " Only"


def _build_invoice_pdf(invoice_number: str, data: InvoiceSend) -> bytes:
    """Generate a PDF invoice matching the SJRI template using reportlab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
    from reportlab.platypus import Image as RLImage

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=20*mm, rightMargin=20*mm,
                            topMargin=15*mm, bottomMargin=15*mm)

    styles = getSampleStyleSheet()
    normal = ParagraphStyle("normal", fontSize=10, leading=14)
    bold = ParagraphStyle("bold", fontSize=10, leading=14, fontName="Helvetica-Bold")
    center_bold = ParagraphStyle("center_bold", fontSize=13, leading=16, fontName="Helvetica-Bold", alignment=TA_CENTER)
    center_bold_ul = ParagraphStyle("center_bold_ul", fontSize=12, leading=16, fontName="Helvetica-Bold", alignment=TA_CENTER, underlineProportion=0.5)
    right_small = ParagraphStyle("right_small", fontSize=8, leading=12, alignment=TA_RIGHT, textColor=colors.HexColor("#444444"))
    small_italic = ParagraphStyle("small_italic", fontSize=8, leading=12, fontName="Helvetica-Oblique", alignment=TA_CENTER, textColor=colors.HexColor("#444444"))

    story = []

    # ── Header ──
    header_data = [[]]
    if os.path.exists(_logo_path):
        logo_img = RLImage(_logo_path, width=18*mm, height=18*mm)
        header_data[0].append(logo_img)
    else:
        header_data[0].append(Paragraph("SJRI", bold))

    inst_text = (
        "<b>ST. JOHN'S NATIONAL ACADEMY OF HEALTH SCIENCES</b><br/>"
        "<b>ST. JOHN'S RESEARCH INSTITUTE</b><br/>"
        "<font size='8' color='#444444'><i>(A Unit of CBCI Society for Medical Education)</i></font>"
    )
    header_data[0].append(Paragraph(inst_text, ParagraphStyle("inst", fontSize=11, leading=15, alignment=TA_CENTER)))

    addr_text = (
        "Sarjapur Road,<br/>"
        "Bangalore – 560 034,<br/>"
        "Tel: +91-80-4946 7001<br/>"
        "E-mail: deansoffice@sjri.res.in"
    )
    header_data[0].append(Paragraph(addr_text, ParagraphStyle("addr", fontSize=8, leading=12, alignment=TA_RIGHT, textColor=colors.HexColor("#333333"))))

    page_w = A4[0] - 40*mm
    header_table = Table(header_data, colWidths=[22*mm, page_w - 22*mm - 45*mm, 45*mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.black))
    story.append(Spacer(1, 5*mm))

    # ── Invoice No + Date ──
    inv_date_str = data.invoice_date.strftime("%d/%m/%Y")
    meta_data = [[
        Paragraph(f"<b>No: {invoice_number}</b>", normal),
        Paragraph(inv_date_str, ParagraphStyle("date", fontSize=10, alignment=TA_RIGHT)),
    ]]
    meta_table = Table(meta_data, colWidths=[page_w / 2, page_w / 2])
    meta_table.setStyle(TableStyle([("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    story.append(meta_table)
    story.append(Spacer(1, 3*mm))

    # ── To / Through / Department ──
    to_lines = f"To,<br/>{data.to_name or '—'}<br/>"
    if data.through_name:
        to_lines += f"Through {data.through_name}<br/>"
    to_lines += f"Department of {data.department or '—'}<br/>SJMC"
    story.append(Paragraph(to_lines, ParagraphStyle("to", fontSize=10, leading=16)))
    story.append(Spacer(1, 5*mm))

    # ── INVOICE title ──
    story.append(Paragraph("<u>INVOICE</u>", center_bold))
    story.append(Spacer(1, 4*mm))

    # ── Particulars table ──
    amt = float(data.amount) if data.amount else 0.0
    amount_num = f"{amt:,.2f}" if amt > 0 else "—"
    amount_words = _amount_in_words(amt) if amt > 0 else "—"

    tbl_data = [
        [Paragraph("<b>Sl.No</b>", normal), Paragraph("<b>Particulars</b>", normal), Paragraph("<b>Total Amount</b>", ParagraphStyle("th_r", fontSize=10, alignment=TA_RIGHT))],
        ["", Paragraph(data.particulars or "—", normal), Paragraph(amount_num, ParagraphStyle("amt", fontSize=10, alignment=TA_RIGHT))],
        [Paragraph(f"<b>Grand Total: {amount_words}</b>", ParagraphStyle("gt", fontSize=10, alignment=TA_CENTER, colSpan=2)), "", ""],
    ]
    tbl = Table(tbl_data, colWidths=[15*mm, page_w - 15*mm - 40*mm, 40*mm])
    tbl.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#555555")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#555555")),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f5f5f5")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("SPAN", (0, 2), (1, 2)),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 5*mm))

    # ── Payment note ──
    story.append(Paragraph(
        "Kindly transfer payment to Biostatistics Cost Centre <b>St.John's Research Institute A/c</b>",
        normal
    ))
    story.append(Spacer(1, 12*mm))

    # ── Signature ──
    story.append(Paragraph("Thanking You,", normal))
    story.append(Paragraph("Sincerely,", normal))
    story.append(Spacer(1, 12*mm))
    story.append(Paragraph("<b>Dr. TINKU THOMAS</b>", bold))
    story.append(Paragraph("Professor &amp; Head", normal))
    story.append(Paragraph("Dept of Biostatistics", normal))
    story.append(Paragraph("St John's Medical College", normal))

    # ── Taken by ──
    if data.taken_by:
        story.append(Spacer(1, 6*mm))
        story.append(Paragraph(f"Consultation has been taken by {data.taken_by}", right_small))

    doc.build(story)
    return buf.getvalue()


def _build_invoice_html(invoice_number: str, data: InvoiceSend) -> str:
    """Build an HTML string that matches the SJRI invoice template.

    All user-supplied string fields are escaped with html.escape() to prevent
    HTML/script injection in the email body.
    """
    invoice_date_str = data.invoice_date.strftime("%d/%m/%Y")
    amt = float(data.amount) if data.amount else 0.0
    amount_num = f"{amt:,.2f}" if amt > 0 else "—"
    amount_words = _amount_in_words(amt) if amt > 0 else "—"

    # Escape every user-supplied value before interpolation into HTML
    safe_to_name = html_lib.escape(data.to_name or "")
    safe_department = html_lib.escape(data.department or "")
    safe_particulars = html_lib.escape(data.particulars or "")
    safe_through = html_lib.escape(data.through_name or "") if data.through_name else ""
    safe_taken_by = html_lib.escape(data.taken_by or "") if data.taken_by else ""

    through_line = f"Through {safe_through}<br>" if safe_through else ""
    taken_by_line = (
        f'<div style="margin-top:24px; font-size:12px; text-align:right; color:#444;">'
        f'Consultation has been taken by {safe_taken_by}</div>'
        if safe_taken_by else ""
    )
    logo_tag = (
        f'<img src="data:image/png;base64,{_LOGO_B64}" '
        f'width="80" height="80" alt="SJRI" style="object-fit:contain; flex-shrink:0;" />'
        if _LOGO_B64 else ""
    )

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body {{ font-family: Arial, sans-serif; font-size: 13px; color: #111; margin: 0; padding: 0; }}
  .page {{ width: 660px; margin: 20px auto; border: 1px solid #bbb; padding: 28px 36px; background: #fff; }}
  table {{ width: 100%; border-collapse: collapse; }}
  th, td {{ border: 1px solid #555; padding: 7px 10px; }}
</style>
</head>
<body>
<div class="page">

  <!-- Header: logo | institution | address -->
  <div style="display:table; width:100%; border-bottom:2px solid #111; padding-bottom:12px; margin-bottom:20px;">
    <div style="display:table-cell; width:90px; vertical-align:top;">
      {logo_tag}
    </div>
    <div style="display:table-cell; text-align:center; vertical-align:top; padding-top:4px;">
      <div style="font-weight:bold; font-size:16px; letter-spacing:0.5px;">ST. JOHN&#39;S NATIONAL ACADEMY OF HEALTH SCIENCES</div>
      <div style="font-weight:bold; font-size:14px; margin-top:2px;">ST. JOHN&#39;S RESEARCH INSTITUTE</div>
      <div style="font-size:11px; font-style:italic; margin-top:4px; color:#444;">(A Unit of CBCI Society for Medical Education)</div>
    </div>
    <div style="display:table-cell; width:160px; font-size:11px; line-height:1.6; color:#333; text-align:right; vertical-align:top;">
      Sarjapur Road,<br>
      Bangalore &#8211; 560 034,<br>
      Tel: +91-80-4946 7001<br>
      E-mail: deansoffice@sjri.res.in
    </div>
  </div>

  <!-- Invoice No + Date -->
  <div style="display:table; width:100%; margin-bottom:20px; font-size:13px;">
    <div style="display:table-cell;"><strong>No: {invoice_number}</strong></div>
    <div style="display:table-cell; text-align:right;">{invoice_date_str}</div>
  </div>

  <!-- To / Through / Department -->
  <div style="line-height:1.8; margin-bottom:24px; font-size:13px;">
    To,<br>
    {safe_to_name}<br>
    {through_line}Department of {safe_department}<br>
    SJMC
  </div>

  <!-- INVOICE title -->
  <div style="text-align:center; font-weight:bold; font-size:14px; text-decoration:underline; margin-bottom:16px; letter-spacing:1px;">
    INVOICE
  </div>

  <!-- Particulars table -->
  <table style="margin-bottom:8px;">
    <thead>
      <tr>
        <th style="text-align:left; background:#f5f5f5; width:60px;">Sl.No</th>
        <th style="text-align:center; background:#f5f5f5;">Particulars</th>
        <th style="text-align:right; background:#f5f5f5; width:150px;">Total Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="vertical-align:top;"></td>
        <td style="vertical-align:top;">{safe_particulars}</td>
        <td style="text-align:right; vertical-align:top;">{amount_num}</td>
      </tr>
      <tr>
        <td colspan="2" style="font-weight:bold; text-align:center;">Grand Total: {amount_words}</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <!-- Payment note -->
  <div style="margin-top:20px; font-size:13px;">
    Kindly transfer payment to Biostatistics Cost Centre
    <strong>St.John&#39;s Research Institute A/c</strong>
  </div>

  <!-- Signature -->
  <div style="margin-top:40px; font-size:13px;">
    Thanking You,<br>
    Sincerely,<br>
    <div style="margin-top:36px;">
      <div style="font-weight:bold;">Dr. TINKU THOMAS</div>
      <div>Professor &amp; Head</div>
      <div>Dept of Biostatistics</div>
      <div>St John&#39;s Medical College</div>
    </div>
  </div>

  {taken_by_line}
</div>
</body>
</html>"""


# ============================================================================
# GET NEXT INVOICE NUMBER
# ============================================================================

@router.get("/next-number")
@limiter.limit("30/minute")
async def get_next_invoice_number(
    request: Request,
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """Return the next available invoice number for the current financial year."""
    invoice_number = await _next_invoice_number()
    return {"invoice_number": invoice_number}


# ============================================================================
# SEND INVOICE
# ============================================================================

def _send_invoice_email_and_mark_sent(
    invoice_id: str,
    invoice_number: str,
    recipient_email: str,
    subject: str,
    html: str,
    invoice_data: "InvoiceSend | None" = None,
) -> None:
    """Background task: send the invoice email, then stamp sent_at.

    Runs after the HTTP response has already been returned to the client so
    SMTP latency (300ms–3s) does not block the request.

    On success: sets sent_at to the current UTC timestamp.
    On failure: sets email_failed = TRUE so the row is distinguishable from
    "not yet sent" (sent_at IS NULL, email_failed = FALSE).  The invoice data
    is preserved and the send can be retried via a future resend endpoint.
    """
    from utils.email import send_email_with_pdf
    import traceback

    def _log(msg: str):
        log_path = os.path.join(os.path.dirname(__file__), "..", "invoice_debug.log")
        with open(log_path, "a") as f:
            f.write(f"{datetime.now(timezone.utc).isoformat()} {msg}\n")

    try:
        _log(f"START {invoice_number} -> {recipient_email}")
        pdf_bytes = _build_invoice_pdf(invoice_number, invoice_data)
        pdf_filename = f"Invoice_{invoice_number.replace('/', '-')}.pdf"
        body_text = (
            f"Dear {invoice_data.to_name},\n\n"
            f"Please find attached invoice {invoice_number} from the Department of Biostatistics, "
            f"St. John's Research Institute.\n\n"
            f"Regards,\nDept of Biostatistics\nSt John's Medical College"
        )
        send_email_with_pdf(recipient_email, subject, body_text, pdf_bytes, pdf_filename)
        supabase.table("invoices") \
            .update({"sent_at": datetime.now(timezone.utc).isoformat(), "email_failed": False}) \
            .eq("invoice_id", invoice_id) \
            .execute()
        _log(f"SUCCESS {invoice_number}")
        logger.info("Invoice %s emailed to %s", invoice_number, recipient_email)
    except Exception as e:
        _log(f"FAILED {invoice_number} — {traceback.format_exc()}")
        logger.error(
            "Invoice %s was saved but email to %s FAILED — marked email_failed=true. "
            "Error: %s",
            invoice_number, recipient_email, e,
        )
        try:
            supabase.table("invoices") \
                .update({"email_failed": True}) \
                .eq("invoice_id", invoice_id) \
                .execute()
        except Exception as db_err:
            logger.error(
                "Could not mark invoice %s as email_failed: %s", invoice_number, db_err
            )


@router.post("/send", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def send_invoice(
    request: Request,
    data: InvoiceSend,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """
    Create an invoice record and dispatch the email in a background task.

    - Generates an auto-sequential invoice number (SJRI/XXX/YYYY-YY)
    - Saves the invoice to the `invoices` table
    - Returns 201 immediately; email is sent after the response is written
    - If email delivery fails, the invoice row stays with sent_at = NULL
    """
    # Check the consultation exists
    consult_check = await execute_query(
        supabase.table("consultations")
        .select("consultation_id, status")
        .eq("consultation_id", str(data.consultation_id))
        .maybe_single()
    )

    if not consult_check.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found."
        )

    invoice_number = await _next_invoice_number()

    record = {
        "consultation_id": str(data.consultation_id),
        "invoice_number": invoice_number,
        "invoice_date": data.invoice_date.isoformat(),
        "to_name": data.to_name,
        "through_name": data.through_name,
        "department": data.department,
        "particulars": data.particulars,
        "amount": data.amount,
        "taken_by": data.taken_by,
        "recipient_email": data.recipient_email,
    }

    insert_result = await execute_query(supabase.table("invoices").insert(record))
    saved = insert_result.data[0]

    # Queue the email — response is returned before the send completes
    print(f"[INVOICE] Queuing background email task for {invoice_number}", flush=True)
    html = _build_invoice_html(invoice_number, data)
    subject = f"Consultation Invoice {invoice_number} – {data.to_name}"
    background_tasks.add_task(
        _send_invoice_email_and_mark_sent,
        invoice_id=saved["invoice_id"],
        invoice_number=invoice_number,
        recipient_email=data.recipient_email,
        subject=subject,
        html=html,
        invoice_data=data,
    )

    return saved
