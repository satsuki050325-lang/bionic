import type { Request, Response, NextFunction } from 'express'
import { getConfig } from '../config.js'

export function engineAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const config = getConfig()
  const token = config.engine.token

  if (!token) {
    if (config.engine.isProduction) {
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

  const provided = authHeader.slice(7)
  if (provided !== token) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }

  next()
}
