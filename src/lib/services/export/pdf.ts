export type PDFOptions = { title?: string; footer?: string };

export async function generatePDFReport(_data: any, _opts?: PDFOptions): Promise<Uint8Array> {
  // TODO: wire a real PDF generator (e.g., @react-pdf/renderer, pdf-lib, or Puppeteer)
  // Minimal 1-byte buffer placeholder
  return new Uint8Array([0x25]); // '%'
}