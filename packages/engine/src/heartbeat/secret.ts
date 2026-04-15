import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto'
import { getConfig } from '../config.js'

/**
 * Generate a 256-bit random secret, base64url-encoded (43 chars).
 * Returned plaintext is shown to the caller exactly once at create time.
 */
export function generateHeartbeatSecret(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Derive the HMAC-SHA256 hash of a plaintext secret using the server-side
 * pepper configured via BIONIC_HEARTBEAT_HMAC_KEY. Output is lowercase hex.
 */
export function hashHeartbeatSecret(plaintext: string): string {
  const { heartbeat } = getConfig()
  return createHmac('sha256', heartbeat.hmacKey)
    .update(plaintext, 'utf8')
    .digest('hex')
}

/**
 * Constant-time comparison of a candidate plaintext secret against a stored
 * hash. Returns false on any shape mismatch without revealing timing.
 */
export function verifyHeartbeatSecret(
  candidatePlaintext: string,
  storedHashHex: string
): boolean {
  if (!candidatePlaintext || !storedHashHex) return false
  const candidateHex = hashHeartbeatSecret(candidatePlaintext)
  const a = Buffer.from(candidateHex, 'hex')
  const b = Buffer.from(storedHashHex, 'hex')
  if (a.length !== b.length || a.length === 0) return false
  return timingSafeEqual(a, b)
}
