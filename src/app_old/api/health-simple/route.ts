export const dynamic = 'force-static'
export const revalidate = false

export async function GET() {
  // Ultra-simple health check that always returns 200
  return new Response('OK', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  })
}
