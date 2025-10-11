import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  console.log('Pages Router health check hit at', new Date().toISOString())
  res.status(200).json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    router: 'pages',
    pid: process.pid 
  })
}