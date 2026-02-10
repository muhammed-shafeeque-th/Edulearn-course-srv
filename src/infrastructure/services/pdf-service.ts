import { Injectable } from "@nestjs/common";
import  PDFDocument, {} from "pdfkit";
import { Readable } from "stream";
import { Certificate } from "../../domain/entities/certificate.entity";
import { ICertificatePDFGenerator } from "src/application/services/pdf-certificate-generator.adapter";

@Injectable()
export class CertificatePDFGeneratorImpl implements ICertificatePDFGenerator{
  /**
   * Generate PDF certificate
   * Returns a readable stream
   */
  async generate(certificate: Certificate): Promise<Readable> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          layout: "landscape",
          margin: 50,
        });

        const stream = new Readable();
        stream._read = () => {};

        doc.on("data", (chunk) => stream.push(chunk));
        doc.on("end", () => {
          stream.push(null);
          resolve(stream);
        });
        doc.on("error", reject);

        this.drawCertificate(doc, certificate);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Draw certificate content
   */
  private drawCertificate(
    doc: typeof PDFDocument,
    certificate: Certificate
  ): void {
    const width = doc.page.width;
    const height = doc.page.height;

    // Background pattern
    this.drawBackgroundPattern(doc);

    // Decorative borders
    this.drawBorders(doc);

    // Logo/Badge
    this.drawLogo(doc, width / 2, 100);

    // Title
    doc
      .font("Helvetica-Bold")
      .fontSize(48)
      .fillColor("#1e293b")
      .text("Certificate of Accomplishment", 0, 150, {
        align: "center",
        width: width,
      });

    // Course badge
    doc
      .fontSize(16)
      .fillColor("#3b82f6")
      .text(certificate.getCourseTitle(), 0, 210, {
        align: "center",
        width: width,
      });

    // "Presented To" label
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#64748b")
      .text("PRESENTED TO", 0, 270, {
        align: "center",
        width: width,
      });

    // Student name
    doc
      .font("Times-Italic")
      .fontSize(36)
      .fillColor("#1e293b")
      .text(certificate.getStudentName(), 0, 300, {
        align: "center",
        width: width,
      });

    // Name underline
    doc
      .moveTo(width / 2 - 150, 350)
      .lineTo(width / 2 + 150, 350)
      .strokeColor("#cbd5e1")
      .lineWidth(2)
      .stroke();

    // Description
    doc
      .font("Helvetica")
      .fontSize(14)
      .fillColor("#64748b")
      .text(
        "The bearer of this certificate has successfully passed the EduLearn\nskill certification test and demonstrated proficiency in the subject matter.",
        0,
        380,
        {
          align: "center",
          width: width,
        }
      );

    // Footer - Date section
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#94a3b8")
      .text("Earned on:", 80, height - 120);

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#475569")
      .text(this.formatDate(certificate.getIssueDate()), 80, height - 105);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#94a3b8")
      .text(`ID: ${certificate.getCertificateNumber()}`, 80, height - 85);

    // Footer - Signature section
    doc
      .font("Times-Italic")
      .fontSize(24)
      .fillColor("#475569")
      .text("EduLearn Team", width - 250, height - 125, {
        align: "right",
        width: 200,
      });

    // Signature line
    doc
      .moveTo(width - 250, height - 100)
      .lineTo(width - 50, height - 100)
      .strokeColor("#cbd5e1")
      .lineWidth(1)
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#64748b")
      .text("CTO, EduLearn", width - 250, height - 90, {
        align: "right",
        width: 200,
      });

    // Verification badge
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#94a3b8")
      .text(
        `Verified Certificate • ${certificate.getCertificateNumber()}`,
        0,
        height - 60,
        {
          align: "center",
          width: width,
        }
      );

    // Watermark
    doc
      .font("Helvetica-Bold")
      .fontSize(100)
      .fillColor("#e2e8f0")
      .opacity(0.05)
      .text("EDULEARN", 0, height / 2 - 50, {
        align: "center",
        width: width,
      })
      .opacity(1);
  }

  /**
   * Draw background pattern
   */
  private drawBackgroundPattern(doc: typeof PDFDocument): void {
    const width = doc.page.width;
    const height = doc.page.height;

    doc.save();
    doc.opacity(0.03);

    // Draw simple grid pattern
    for (let x = 0; x < width; x += 60) {
      for (let y = 0; y < height; y += 60) {
        doc
          .moveTo(x + 36, y + 34)
          .lineTo(x + 36, y + 30)
          .lineTo(x + 32, y + 30)
          .lineTo(x + 32, y + 26)
          .lineTo(x + 28, y + 26)
          .lineTo(x + 28, y + 30)
          .lineTo(x + 24, y + 30)
          .lineTo(x + 24, y + 34)
          .lineTo(x + 28, y + 34)
          .lineTo(x + 28, y + 38)
          .lineTo(x + 32, y + 38)
          .lineTo(x + 32, y + 34)
          .lineTo(x + 36, y + 34)
          .fillColor("#9C92AC")
          .fill();
      }
    }

    doc.restore();
  }

  /**
   * Draw decorative borders
   */
  private drawBorders(doc: typeof PDFDocument): void {
    const width = doc.page.width;
    const height = doc.page.height;

    // Outer border
    doc
      .roundedRect(30, 30, width - 60, height - 60, 8)
      .strokeColor("#cbd5e1")
      .lineWidth(3)
      .stroke();

    // Inner border
    doc
      .roundedRect(36, 36, width - 72, height - 72, 6)
      .strokeColor("#e2e8f0")
      .lineWidth(1)
      .stroke();
  }

  /**
   * Draw logo/badge
   */
  private drawLogo(doc: typeof PDFDocument, x: number, y: number): void {
    // Draw circular badge
    doc.circle(x, y, 40).fillColor("#3b82f6").fill();

    // Draw white border
    doc.circle(x, y, 40).strokeColor("#ffffff").lineWidth(4).stroke();

    // Draw "E" letter
    doc
      .font("Helvetica-Bold")
      .fontSize(36)
      .fillColor("#ffffff")
      .text("E", x - 13, y - 18);
  }

  /**
   * Format date
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}
