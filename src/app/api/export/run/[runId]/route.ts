import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateChecksums } from '@/lib/checksum';
import { runs } from '@/lib/api-client';
import type { RunHeader, TimelineEvent } from '@/types/runs';

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params;
    
    // Fetch run data using our typed API client
    const runPromise = runs.get(runId);
    // Timeline is not available in the client, fetch directly
    const timelinePromise = fetch(`/api/v1/runs/${runId}/timeline`).then(res => res.json());
    
    const [run, timeline] = await Promise.all([runPromise, timelinePromise]);
    
    // Generate file contents
    const files = {
      'run.json': JSON.stringify(run, null, 2),
      'timeline.json': JSON.stringify(timeline, null, 2),
      'summary.md': generateSummaryMarkdown(run, timeline),
      'summary.pdf': await generateSummaryPDF(run, timeline),
    };
    
    // Generate checksums
    const textFiles = { ...files };
    delete textFiles['summary.pdf']; // Exclude binary PDF from text checksum
    const checksums = generateChecksums(textFiles);
    files['checksums.txt'] = checksums;
    
    // Create ZIP
    const zip = new JSZip();
    
    // Add text files
    zip.file('run.json', files['run.json']);
    zip.file('timeline.json', files['timeline.json']);
    zip.file('summary.md', files['summary.md']);
    zip.file('checksums.txt', files['checksums.txt']);
    
    // Add PDF as binary
    zip.file('summary.pdf', files['summary.pdf'], { binary: true });
    
    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    // Return ZIP response
    const filename = `hera-evidence-run-${runId}.zip`;
    
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export run evidence pack' },
      { status: 500 }
    );
  }
}

function generateSummaryMarkdown(run: RunHeader, timeline: TimelineEvent[]): string {
  const completedSteps = timeline.filter(e => e.event_type === 'step_completed').length;
  const totalSteps = run.step_count || 0;
  
  return `# HERA Playbook Run Summary

## Run Information
- **Run ID**: ${run.id}
- **Playbook**: ${run.playbook_name} (${run.playbook_version})
- **Status**: ${run.status}
- **Organization**: ${run.organization_id}

## Timeline
- **Started**: ${run.started_at}
- **Completed**: ${run.completed_at || 'In Progress'}
- **Duration**: ${run.actual_duration_minutes ? `${run.actual_duration_minutes} minutes` : 'N/A'}

## Progress
- **Steps Completed**: ${completedSteps} / ${totalSteps}
- **Progress**: ${run.progress_percentage || 0}%

## Summary
This evidence pack contains the complete execution record for HERA playbook run ${run.id}.
The run executed ${run.playbook_name} version ${run.playbook_version} with ${timeline.length} timeline events recorded.

## Files Included
- run.json - Complete run header data
- timeline.json - Chronological event timeline
- summary.pdf - Formatted summary document
- checksums.txt - SHA-256 checksums for verification

Generated on: ${new Date().toISOString()}
`;
}

async function generateSummaryPDF(run: RunHeader, timeline: TimelineEvent[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  let y = height - 50;
  
  // Title
  page.drawText('HERA Playbook Run Summary', {
    x: 50,
    y,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 40;
  
  // Run Information
  const addField = (label: string, value: string, size = 12) => {
    page.drawText(`${label}: `, {
      x: 50,
      y,
      size,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(value, {
      x: 150,
      y,
      size,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 20;
  };
  
  addField('Run ID', run.id);
  addField('Playbook', `${run.playbook_name} (${run.playbook_version})`);
  addField('Status', run.status);
  addField('Started', run.started_at);
  addField('Completed', run.completed_at || 'In Progress');
  
  if (run.actual_duration_minutes) {
    addField('Duration', `${run.actual_duration_minutes} minutes`);
  }
  
  const completedSteps = timeline.filter(e => e.event_type === 'step_completed').length;
  const totalSteps = run.step_count || 0;
  addField('Progress', `${completedSteps}/${totalSteps} steps (${run.progress_percentage || 0}%)`);
  
  y -= 20;
  
  // Timeline Summary
  page.drawText('Timeline Events', {
    x: 50,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 30;
  
  const eventCounts = timeline.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(eventCounts).forEach(([eventType, count]) => {
    addField(eventType.replace(/_/g, ' '), count.toString(), 10);
  });
  
  // Footer
  page.drawText(`Generated on: ${new Date().toISOString()}`, {
    x: 50,
    y: 50,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  return pdfDoc.save();
}