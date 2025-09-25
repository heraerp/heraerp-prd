import { NextRequest, NextResponse } from 'next/server';

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id');
    
    if (!orgId || orgId !== CIVICFLOW_ORG_ID) {
      return NextResponse.json(
        { error: 'Invalid organization' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const sources = searchParams.get('sources')?.split(',') || [];

    // Fetch calendar items (reusing mock data for now)
    const mockItems = [
      {
        id: '1',
        title: 'Grant Application Deadline',
        description: 'Final submission for Community Development Grant',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        source: 'grants',
        category: 'deadline',
        location: 'Online Portal',
      },
      {
        id: '2',
        title: 'Case Review Meeting',
        description: 'Monthly review of active constituent cases',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 90,
        source: 'cases',
        category: 'meeting',
        location: 'Conference Room A',
      },
    ];

    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = ['Title', 'Date', 'Time', 'Duration', 'Source', 'Category', 'Location', 'Description'];
      const csvRows = [csvHeaders.join(',')];

      mockItems.forEach(item => {
        const date = new Date(item.date);
        const row = [
          `"${item.title}"`,
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          `${item.duration} min`,
          item.source,
          item.category,
          `"${item.location || ''}"`,
          `"${item.description || ''}"`,
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="civicflow-calendar-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    if (format === 'ics') {
      // Generate ICS content
      let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CivicFlow//Calendar Export//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:CivicFlow Calendar
X-WR-TIMEZONE:America/New_York`;

      mockItems.forEach(item => {
        const startDate = new Date(item.date);
        const endDate = new Date(startDate.getTime() + (item.duration || 60) * 60 * 1000);
        
        icsContent += `
BEGIN:VEVENT
UID:${item.id}@civicflow.gov
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${item.title}
DESCRIPTION:${item.description || ''}
LOCATION:${item.location || ''}
STATUS:CONFIRMED
CATEGORIES:${item.category.toUpperCase()}
END:VEVENT`;
      });

      icsContent += '\nEND:VCALENDAR';

      return new NextResponse(icsContent, {
        headers: {
          'Content-Type': 'text/calendar',
          'Content-Disposition': `attachment; filename="civicflow-calendar-${new Date().toISOString().split('T')[0]}.ics"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });

  } catch (error) {
    console.error('Error exporting calendar:', error);
    return NextResponse.json(
      { error: 'Failed to export calendar' },
      { status: 500 }
    );
  }
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}