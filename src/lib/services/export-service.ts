/**
 * Export Service
 * Handles data export in various formats
 */

export const exportService = {
  /**
   * Generate CSV from data
   */
  generateCSV(data: Record<string, any>[]): string {
    if (!data.length) return '';
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    // Convert data rows
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Escape values containing commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
  },

  /**
   * Generate ZIP file from multiple files
   * Note: This is a placeholder - in production, use a library like JSZip
   */
  async generateZip(files: Array<{ filename: string; content: string }>): Promise<Blob> {
    // In a real implementation, use JSZip or similar
    // For now, return a text file with all contents
    const combined = files.map(f => `=== ${f.filename} ===\n${f.content}`).join('\n\n');
    return new Blob([combined], { type: 'application/zip' });
  }
};