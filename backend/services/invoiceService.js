/**
 * Invoice Service
 * Renders a professionally-designed PDF invoice for a member's registration
 * payment, saves it to disk + MongoDB, and emails it to the member.
 *
 * PDF layout uses PDFKit's built-in standard-14 fonts only (no external font
 * files are bundled in this environment) - hierarchy and "creative" styling
 * come from layout, color and vector-drawn elements instead. Real brand font
 * files can be dropped into backend/assets/fonts and swapped in via the
 * FONTS map below without touching the rest of the layout code.
 */

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const moment = require("moment");

const Invoice = require("../models/Invoice");
const { getNextInvoiceNumber } = require("../utils/invoiceNumber");
const { amountToWords } = require("../utils/numberToWords");
const { sendInvoiceEmail } = require("./emailService");

const INVOICES_DIR = path.join(__dirname, "..", "uploads", "invoices");

const FONTS = {
  heading: "Helvetica-Bold",
  body: "Helvetica",
  italic: "Helvetica-Oblique",
  mono: "Courier",
};

const COLORS = {
  brand: "#0b3d2e",
  brandLight: "#e6f0eb",
  gold: "#c9a227",
  text: "#26332d",
  muted: "#6b7a72",
  border: "#dfe8e2",
  white: "#ffffff",
};

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 40;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

const money = (n) =>
  `Rs. ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Draws the full invoice onto an already-open PDFDocument.
 */
const drawInvoice = (doc, data) => {
  const { invoiceNumber, issuedAt, billingSnapshot, amounts, razorpayOrderId, razorpayPaymentId } = data;

  const company = {
    name: process.env.COMPANY_LEGAL_NAME || "GBN - Grow Business Network",
    gstin: process.env.COMPANY_GSTIN || "[REPLACE - GSTIN]",
    pan: process.env.COMPANY_PAN || "[REPLACE - PAN]",
    cin: process.env.COMPANY_CIN || "[REPLACE - CIN]",
    address: process.env.COMPANY_ADDRESS || "[REPLACE - Registered Office Address]",
    state: process.env.COMPANY_STATE || "[REPLACE - State]",
    stateCode: process.env.COMPANY_STATE_CODE || "[REPLACE - GST State Code]",
    phone: process.env.COMPANY_PHONE || "[REPLACE - Support Phone]",
    email: process.env.SMTP_FROM_EMAIL || "support@gbnsocialassociation.com",
    terms:
      process.env.INVOICE_TERMS ||
      "[REPLACE - Terms & Conditions to be shown on the invoice footer]",
  };

  // ---------- Header band ----------
  // Company name can be long real-world legal text (or an unfilled
  // placeholder), so its height is measured rather than assumed - the
  // subtitle and header band are positioned/sized off that measurement to
  // avoid overlap regardless of how many lines the name wraps to.
  const titleWidth = 300;
  const titleFontSize = 20;
  doc.font(FONTS.heading).fontSize(titleFontSize);
  const titleHeight = doc.heightOfString(company.name, { width: titleWidth });

  const headerPadTop = 26;
  const titleSubtitleGap = 6;
  const subtitleHeight = 12;
  const headerPadBottom = 18;
  const headerHeight = Math.max(
    128,
    headerPadTop + titleHeight + titleSubtitleGap + subtitleHeight + headerPadBottom,
  );

  doc.rect(0, 0, PAGE.width, headerHeight).fill(COLORS.brand);

  // Angular gold accent, top-right corner
  doc
    .save()
    .opacity(0.18)
    .polygon([PAGE.width - 160, 0], [PAGE.width, 0], [PAGE.width, headerHeight])
    .fill(COLORS.gold)
    .restore();

  doc
    .font(FONTS.heading)
    .fontSize(titleFontSize)
    .fillColor(COLORS.white)
    .text(company.name, MARGIN, headerPadTop, { width: titleWidth });

  doc
    .font(FONTS.italic)
    .fontSize(9)
    .fillColor(COLORS.brandLight)
    .text(
      "Membership Registration Invoice",
      MARGIN,
      headerPadTop + titleHeight + titleSubtitleGap,
      { width: titleWidth },
    );

  // TAX INVOICE badge, vertically centered within the header band
  const badgeW = 200;
  const badgeH = 78;
  const badgeX = PAGE.width - MARGIN - badgeW;
  const badgeY = Math.max(24, (headerHeight - badgeH) / 2);
  doc
    .roundedRect(badgeX, badgeY, badgeW, badgeH, 6)
    .lineWidth(1)
    .strokeColor(COLORS.gold)
    .stroke();

  doc
    .font(FONTS.heading)
    .fontSize(13)
    .fillColor(COLORS.gold)
    .text("TAX INVOICE", badgeX, badgeY + 10, { width: badgeW, align: "center" });

  doc
    .font(FONTS.body)
    .fontSize(9)
    .fillColor(COLORS.white)
    .text(`Invoice No: ${invoiceNumber}`, badgeX, badgeY + 34, { width: badgeW, align: "center" })
    .text(`Date: ${moment(issuedAt).format("DD MMM YYYY")}`, badgeX, badgeY + 50, {
      width: badgeW,
      align: "center",
    });

  // Gold divider under the header band
  doc.rect(0, headerHeight, PAGE.width, 3).fill(COLORS.gold);

  // ---------- Billed To / Issuer cards ----------
  const cardY = headerHeight + 3 + 25;
  const cardW = (CONTENT_WIDTH - 20) / 2;
  const card1X = MARGIN;
  const card2X = MARGIN + cardW + 20;
  const cardInnerWidth = cardW - 28;
  const cardTitleAreaHeight = 28;
  const cardPadBottom = 14;

  // Two-pass: measure each card's required height first (real text wraps to
  // different line counts than the fixed-size test data), draw both at the
  // shared max height so neither the card border nor the strip below it
  // ever collides with wrapped text.
  const measureCard = (lines) => {
    let total = 0;
    const heights = lines.map(({ label, value, bold }) => {
      if (!value) return 0;
      doc.font(bold ? FONTS.heading : FONTS.body).fontSize(bold ? 11 : 9);
      const text = label ? `${label}: ${value}` : value;
      const h = doc.heightOfString(text, { width: cardInnerWidth }) + (bold ? 6 : 5);
      total += h;
      return h;
    });
    return { heights, total };
  };

  const billedToLines = [
    { value: billingSnapshot.name, bold: true },
    { value: billingSnapshot.companyName },
    { label: "Email", value: billingSnapshot.email },
    { label: "Mobile", value: billingSnapshot.mobile },
    {
      value: [billingSnapshot.address, billingSnapshot.city, billingSnapshot.state]
        .filter(Boolean)
        .join(", "),
    },
  ];
  const issuerLines = [
    { value: company.name, bold: true },
    { label: "GSTIN", value: company.gstin },
    { label: "PAN", value: company.pan },
    { label: "CIN", value: company.cin },
    { value: `${company.address}${company.state ? ", " + company.state : ""}` },
    { label: "Phone", value: company.phone },
    { label: "Email", value: company.email },
  ];

  const billedToMeasure = measureCard(billedToLines);
  const issuerMeasure = measureCard(issuerLines);
  const cardH = Math.max(
    148,
    cardTitleAreaHeight + billedToMeasure.total + cardPadBottom,
    cardTitleAreaHeight + issuerMeasure.total + cardPadBottom,
  );

  const drawCard = (x, title, lines, measured) => {
    doc
      .roundedRect(x, cardY, cardW, cardH, 8)
      .fillAndStroke(COLORS.brandLight, COLORS.border);

    doc
      .font(FONTS.heading)
      .fontSize(9)
      .fillColor(COLORS.brand)
      .text(title, x + 14, cardY + 12, { width: cardInnerWidth });

    let ly = cardY + cardTitleAreaHeight;
    lines.forEach(({ label, value, bold }, i) => {
      if (!value) return;
      doc
        .font(bold ? FONTS.heading : FONTS.body)
        .fontSize(bold ? 11 : 9)
        .fillColor(bold ? COLORS.text : COLORS.muted)
        .text(label ? `${label}: ${value}` : value, x + 14, ly, { width: cardInnerWidth });
      ly += measured.heights[i];
    });
  };

  drawCard(card1X, "BILLED TO", billedToLines, billedToMeasure);
  drawCard(card2X, "ISSUER DETAILS", issuerLines, issuerMeasure);

  // ---------- Payment reference strip ----------
  const stripY = cardY + cardH + 16;
  doc.roundedRect(MARGIN, stripY, CONTENT_WIDTH, 42, 6).fill(COLORS.brandLight);

  const refColW = CONTENT_WIDTH / 3;
  const refs = [
    { label: "RAZORPAY ORDER ID", value: razorpayOrderId },
    { label: "RAZORPAY PAYMENT ID", value: razorpayPaymentId },
    { label: "PAID ON", value: moment(issuedAt).format("DD MMM YYYY, hh:mm A") },
  ];
  refs.forEach((ref, i) => {
    const x = MARGIN + i * refColW + 12;
    doc
      .font(FONTS.heading)
      .fontSize(7)
      .fillColor(COLORS.muted)
      .text(ref.label, x, stripY + 8, { width: refColW - 20 });
    doc
      .font(FONTS.mono)
      .fontSize(8)
      .fillColor(COLORS.text)
      .text(ref.value || "-", x, stripY + 20, { width: refColW - 20 });
  });

  // ---------- Itemized table ----------
  const tableY = stripY + 42 + 24;
  const descColW = CONTENT_WIDTH - 140;
  const amtColW = 140;

  doc.rect(MARGIN, tableY, CONTENT_WIDTH, 26).fill(COLORS.brand);
  doc
    .font(FONTS.heading)
    .fontSize(9)
    .fillColor(COLORS.white)
    .text("DESCRIPTION", MARGIN + 12, tableY + 8, { width: descColW - 12 })
    .text("AMOUNT (INR)", MARGIN + descColW, tableY + 8, { width: amtColW - 12, align: "right" });

  const rows = [
    ["Membership Registration Fee", amounts.baseAmount],
    [`GST @ ${Math.round((amounts.gstRate || 0.18) * 100)}%`, amounts.gstAmount],
    [`Razorpay Convenience Fee @ ${Math.round((amounts.commissionRate || 0.02) * 100)}%`, amounts.commission],
    [
      `GST on Convenience Fee @ ${Math.round((amounts.commissionGstRate || 0.18) * 100)}%`,
      amounts.commissionGst,
    ],
  ];

  let rowY = tableY + 26;
  const rowH = 24;
  rows.forEach(([label, amount], i) => {
    doc.rect(MARGIN, rowY, CONTENT_WIDTH, rowH).fill(i % 2 === 0 ? COLORS.white : COLORS.brandLight);
    doc
      .font(FONTS.body)
      .fontSize(9.5)
      .fillColor(COLORS.text)
      .text(label, MARGIN + 12, rowY + 7, { width: descColW - 12 })
      .text(money(amount), MARGIN + descColW, rowY + 7, { width: amtColW - 12, align: "right" });
    rowY += rowH;
  });

  // Total row
  doc.rect(MARGIN, rowY, CONTENT_WIDTH, 32).fill(COLORS.gold);
  doc
    .font(FONTS.heading)
    .fontSize(11)
    .fillColor(COLORS.brand)
    .text("TOTAL AMOUNT PAYABLE", MARGIN + 12, rowY + 9, { width: descColW - 12 })
    .text(money(amounts.totalAmount), MARGIN + descColW, rowY + 9, {
      width: amtColW - 12,
      align: "right",
    });
  rowY += 32;

  doc
    .font(FONTS.italic)
    .fontSize(8.5)
    .fillColor(COLORS.muted)
    .text(`Amount in Words: ${amountToWords(amounts.totalAmount)}`, MARGIN, rowY + 10, {
      width: CONTENT_WIDTH,
    });

  // ---------- Footer ----------
  const footerY = PAGE.height - 150;
  doc.rect(MARGIN, footerY, CONTENT_WIDTH, 2).fill(COLORS.gold);

  doc
    .font(FONTS.heading)
    .fontSize(9)
    .fillColor(COLORS.brand)
    .text("Terms & Conditions", MARGIN, footerY + 14);

  doc
    .font(FONTS.body)
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(company.terms, MARGIN, footerY + 28, { width: CONTENT_WIDTH });

  doc
    .font(FONTS.italic)
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      "This is a system-generated invoice and does not require a physical signature.",
      MARGIN,
      footerY + 68,
      { width: CONTENT_WIDTH, align: "center" },
    );

  // Closing brand band
  doc.rect(0, PAGE.height - 40, PAGE.width, 40).fill(COLORS.brand);
  doc
    .font(FONTS.body)
    .fontSize(8)
    .fillColor(COLORS.brandLight)
    .text(
      `© ${moment(issuedAt).format("YYYY")} ${company.name}. All rights reserved.`,
      0,
      PAGE.height - 26,
      { width: PAGE.width, align: "center" },
    );
};

/**
 * @param {Object} data - { invoiceNumber, issuedAt, billingSnapshot, amounts, razorpayOrderId, razorpayPaymentId }
 * @returns {Promise<Buffer>}
 */
const generateInvoicePdf = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      drawInvoice(doc, data);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generates the invoice PDF, saves it to disk + MongoDB, and emails it to
 * the member. Never throws - a PDF/email failure must never block or fail
 * a registration that already took real payment.
 * @param {Object} params - { user, razorpayOrderId, razorpayPaymentId, feeBreakdown }
 * @returns {Promise<Object|null>} The saved Invoice document, or null on failure
 */
const createInvoiceForPayment = async ({ user, razorpayOrderId, razorpayPaymentId, feeBreakdown }) => {
  try {
    fs.mkdirSync(INVOICES_DIR, { recursive: true });

    const invoiceNumber = await getNextInvoiceNumber();
    const issuedAt = new Date();

    const billingSnapshot = {
      name: user.name || "",
      email: user.email || "",
      mobile: user.mobile || "",
      companyName: user.companyName || "",
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
    };

    const data = {
      invoiceNumber,
      issuedAt,
      billingSnapshot,
      amounts: feeBreakdown,
      razorpayOrderId,
      razorpayPaymentId,
    };

    const pdfBuffer = await generateInvoicePdf(data);

    const fileName = `${invoiceNumber.replace(/\//g, "-")}.pdf`;
    const filePath = path.join(INVOICES_DIR, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    const invoice = await Invoice.create({
      user: user._id,
      invoiceNumber,
      razorpayOrderId,
      razorpayPaymentId,
      billingSnapshot,
      amounts: {
        baseAmount: feeBreakdown.baseAmount,
        gstAmount: feeBreakdown.gstAmount,
        commission: feeBreakdown.commission,
        commissionGst: feeBreakdown.commissionGst,
        totalAmount: feeBreakdown.totalAmount,
      },
      currency: feeBreakdown.currency || "INR",
      pdfPath: `invoices/${fileName}`,
      issuedAt,
    });

    if (user.email) {
      try {
        await sendInvoiceEmail(user.email, user.name, invoice, pdfBuffer);
        invoice.status = "email_sent";
        invoice.emailSentAt = new Date();
        await invoice.save();
      } catch (emailError) {
        console.error("Invoice email send error:", emailError.message);
        invoice.status = "email_failed";
        await invoice.save();
      }
    }

    return invoice;
  } catch (error) {
    console.error("Invoice generation error:", error.message);
    return null;
  }
};

module.exports = {
  generateInvoicePdf,
  createInvoiceForPayment,
};
