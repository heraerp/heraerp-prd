/**
 * Client-side file download utility
 */

export function downloadFile(blob: Blob, filename: string): void {
  // Create object URL
  const url = URL.createObjectURL(blob);
  
  // Create temporary link element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up object URL
  URL.revokeObjectURL(url);
}

export function downloadJSON(data: any, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadFile(blob, filename);
}

export function downloadText(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/plain' });
  downloadFile(blob, filename);
}