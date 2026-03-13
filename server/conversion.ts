import mammoth from 'mammoth';
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';

export async function convertDocxToPdf(
  docxBuffer: Buffer,
  outputPath: string
): Promise<void> {
  try {
    // 1. DOCX'ten text çıkar
    const result = await mammoth.extractRawText({ buffer: docxBuffer });
    const text = result.value;

    if (!text || text.trim().length === 0) {
      throw new Error('DOCX file is empty or could not be read');
    }

    // 2. Output klasörünü oluştur
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    // 3. PDF oluştur
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const stream = createWriteStream(outputPath);

      stream.on('finish', () => {
        console.log(`✅ PDF created: ${outputPath}`);
        resolve();
      });

      stream.on('error', reject);

      doc.pipe(stream);

      // Text'i PDF'e yaz
      doc.fontSize(12);
      doc.font('Helvetica');
      doc.text(text, {
        align: 'left',
        lineGap: 5
      });

      doc.end();
    });

  } catch (error) {
    console.error('PDF conversion error:', error);
    throw error;
  }
}

