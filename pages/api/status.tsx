import type { NextApiRequest, NextApiResponse } from 'next'

import { getProviderConfig } from '../../lib/provider'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  const config = getProviderConfig()
  let provider = 'OpenAI-compatible provider'
  try {
    provider = new URL(config.baseUrl).hostname
  } catch {
    // Keep the generic label when the server URL is not parseable.
  }

  return res.status(200).json({
    liveModeAvailable: config.configured,
    provider,
    models: config.models.map(({ id, label, inputCostPerMillion, outputCostPerMillion }) => ({
      id,
      label,
      pricingConfigured: inputCostPerMillion !== null && outputCostPerMillion !== null,
    })),
  })
}
