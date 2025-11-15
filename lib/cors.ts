import { NextApiResponse } from 'next';

const ALLOWED_ORIGINS = ['http://localhost:8080'];

export function setCorsHeaders(res: NextApiResponse, origin?: string) {
  // Check if the origin is in the allowed list
  // If origin matches an allowed origin, use it; otherwise use the first allowed origin
  const requestOrigin = origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(requestOrigin) 
    ? requestOrigin 
    : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export function handleCorsPreflight(req: any, res: NextApiResponse): boolean {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, req.headers.origin);
    res.status(200).end();
    return true;
  }
  return false;
}

