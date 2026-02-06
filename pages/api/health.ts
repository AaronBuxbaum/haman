import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Health check endpoint to verify the deployment is working
 * GET /api/health
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    status: 'ok',
    service: 'haman-broadway-lottery',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasCronSecret: !!process.env.CRON_SECRET
    }
  });
}
