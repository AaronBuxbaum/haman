import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Health check endpoint to verify the Vercel deployment is working
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  return res.status(200).json({
    status: 'ok',
    service: 'haman-broadway-lottery',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      hasCronSecret: !!process.env.CRON_SECRET
    }
  });
}
