export const runtime = 'nodejs'

export async function GET() {
  return new Response('ok', {
    status: 200,
    headers: { 'content-type': 'text/plain' }
  })
}

// Some platforms use HEAD for healthchecks—cover it too.
export async function HEAD() {
  return new Response(null, { status: 200 })
}
