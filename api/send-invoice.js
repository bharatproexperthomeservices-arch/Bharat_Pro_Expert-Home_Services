import nodemailer from "nodemailer";
import { BUSINESS_GST_DETAILS } from "./pricing-catalog.js";

export function generateInvoiceHtml(bookingDetails) {
  const {
    bookingId = "BPE-ORDER",
    paymentId = "N/A",
    customerName = "Valued Customer",
    customerPhone = "",
    customerEmail = "",
    address = "Gurugram, Haryana",
    items = [],
    subtotal = 0,
    gst = 0,
    convenienceFee = 0,
    discount = 0,
    total = 0,
    date = new Date().toLocaleDateString("en-IN")
  } = bookingDetails;

  const itemRows = items.map((it, idx) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee;">${idx + 1}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;"><strong>${it.name || it.serviceName || "Cleaning Service"}</strong></td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${it.qty || it.quantity || 1}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">₹${(it.price || it.unitPrice || 0).toLocaleString("en-IN")}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">₹${((it.price || it.unitPrice || 0) * (it.qty || it.quantity || 1)).toLocaleString("en-IN")}</td>
    </tr>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Tax Invoice - ${bookingId}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1c1c1e; margin: 0; padding: 20px; background: #f4f5f7; }
        .invoice-card { max-width: 680px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #007AFF; padding-bottom: 16px; margin-bottom: 20px; }
        .brand-title { font-size: 22px; font-weight: bold; color: #007AFF; }
        .badge { background: #34C759; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; font-size: 13px; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
        th { background: #f0f4f8; padding: 10px; text-align: left; font-weight: 600; }
        .totals { margin-left: auto; width: 280px; font-size: 13px; line-height: 1.8; }
        .totals-row { display: flex; justify-content: space-between; }
        .totals-grand { font-size: 16px; font-weight: bold; color: #007AFF; border-top: 1px solid #ccc; padding-top: 6px; margin-top: 6px; }
        .footer-note { font-size: 11px; color: #8e8e93; border-top: 1px solid #eee; padding-top: 16px; margin-top: 24px; text-align: center; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
          <div>
            <div class="brand-title">${BUSINESS_GST_DETAILS.businessName}</div>
            <div style="font-size:12px;color:#666;">Legal Name: ${BUSINESS_GST_DETAILS.legalName}</div>
            <div style="font-size:12px;color:#666;"><strong>GSTIN:</strong> ${BUSINESS_GST_DETAILS.gstin}</div>
          </div>
          <div style="text-align:right;">
            <span class="badge">PAID TAX INVOICE</span>
            <div style="font-size:12px;margin-top:8px;color:#666;"><strong>Invoice #:</strong> ${bookingId}</div>
            <div style="font-size:12px;color:#666;"><strong>Date:</strong> ${date}</div>
          </div>
        </div>

        <div class="details-grid">
          <div>
            <strong>Registered Office Address:</strong><br>
            ${BUSINESS_GST_DETAILS.address}
          </div>
          <div>
            <strong>Billed To (Customer):</strong><br>
            <strong>${customerName}</strong><br>
            ${customerPhone ? `Mobile: ${customerPhone}<br>` : ""}
            ${customerEmail ? `Email: ${customerEmail}<br>` : ""}
            Address: ${address}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Service Description</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Unit Price</th>
              <th style="text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row"><span>Taxable Subtotal:</span> <span>₹${subtotal.toLocaleString("en-IN")}</span></div>
          <div class="totals-row"><span>GST (5%):</span> <span>₹${gst.toLocaleString("en-IN")}</span></div>
          ${convenienceFee ? `<div class="totals-row"><span>Visit & Convenience Fee:</span> <span>₹${convenienceFee.toLocaleString("en-IN")}</span></div>` : ""}
          ${discount ? `<div class="totals-row" style="color:#34C759;"><span>Discount:</span> <span>-₹${discount.toLocaleString("en-IN")}</span></div>` : ""}
          <div class="totals-row totals-grand"><span>Total Paid:</span> <span>₹${total.toLocaleString("en-IN")}</span></div>
          <div style="font-size:11px;color:#666;margin-top:4px;">Payment Txn ID: ${paymentId}</div>
        </div>

        <div class="footer-note">
          This is a computer-generated tax invoice issued by <strong>${BUSINESS_GST_DETAILS.businessName}</strong>.<br>
          For queries, contact support at <strong>bharatproexpert@gmail.com</strong> or call <strong>+91 89202 52647</strong>.
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendGstInvoiceEmail(bookingDetails) {
  const recipientEmail = bookingDetails?.customerEmail;
  if (!recipientEmail || typeof recipientEmail !== "string" || !recipientEmail.includes("@")) {
    console.log("No valid customer email specified for sending GST invoice.");
    return { success: false, reason: "NO_RECIPIENT_EMAIL" };
  }

  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!smtpUser || !smtpPass) {
    console.log("SMTP credentials (SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASS) not configured in environment. Skipping email dispatch.");
    return { success: false, reason: "SMTP_NOT_CONFIGURED" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const htmlContent = generateInvoiceHtml(bookingDetails);

    const mailOptions = {
      from: `"Bharat Pro Expert" <${smtpUser}>`,
      to: recipientEmail,
      subject: `Official GST Tax Invoice — ${bookingDetails.bookingId || "Booking Confirmation"}`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("GST Invoice email sent successfully to", recipientEmail, "MessageId:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending GST Invoice email:", error?.message || error);
    return { success: false, error: error?.message || "EMAIL_SEND_FAILED" };
  }
}
