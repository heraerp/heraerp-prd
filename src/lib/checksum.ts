import crypto from 'crypto';

/**
 * Generate SHA-256 checksum for text content
 */
export function generateChecksum(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Generate checksums for multiple files
 */
export function generateChecksums(files: Record<string, string>): string {
  const checksums: string[] = [];
  
  for (const [filename, content] of Object.entries(files)) {
    const checksum = generateChecksum(content);
    checksums.push(`${checksum}  ${filename}`);
  }
  
  return checksums.join('\n');
}