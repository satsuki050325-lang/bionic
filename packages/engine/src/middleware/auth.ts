import type { Request, Response, NextFunction } from 'express'

const ENGINE_TOKEN = process.env.BIONIC_ENGINE_TOKEN

export function engineAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!ENGINE_TOKEN) {
    if (process.env.NODE_ENV === 'production') {
      res.status(500).json({ error: 'BIONIC_ENGINE_TOKEN is required in production' })
      return
    }
    next()
    return
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header required' })
    return
  }

  const token = authHeader.slice(7)
  if (token !== ENGINE_TOKEN) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }

  next()
}
