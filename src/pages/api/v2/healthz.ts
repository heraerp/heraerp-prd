import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    externalResolver: true
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'HEAD') {
    res.status(200).end()
    return
  }
  res.setHeader('content-type', 'text/plain')
  res.status(200).send('ok')
}

