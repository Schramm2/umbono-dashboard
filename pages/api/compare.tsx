import type { NextApiRequest, NextApiResponse } from 'next'

import { getProviderConfig, runProviderComparison } from '../../lib/provider'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  const requestOrigin = req.headers.origin
  const requestHost = String(req.headers['x-forwarded-host'] || req.headers.host || '')
  if (requestOrigin) {
    try {
      if (new URL(requestOrigin).host !== requestHost) {
        return res.status(403).json({ message: 'Cross-origin comparison requests are not allowed.' })
      }
    } catch {
      return res.status(403).json({ message: 'Request origin is invalid.' })
    }
  }

  const config = getProviderConfig()
  if (!config.configured) {
    return res.status(503).json({ message: 'Live mode is not available. Check server configuration and the production live-mode safeguard.' })
  }

  const { prompt, modelIds, evaluationSetId, promptId } = req.body || {}

  try {
    const run = await runProviderComparison({ prompt, modelIds, evaluationSetId, promptId }, config)
    return res.status(200).json(run)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The comparison could not be started.'
    return res.status(400).json({ message })
  }
}
