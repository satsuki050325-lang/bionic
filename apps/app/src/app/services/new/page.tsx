'use client'

import { useState } from 'react'
import Link from 'next/link'
import { sendTestServiceEvent } from './actions'

type Framework = 'nextjs' | 'express' | 'other'
type InstallMethod = 'sdk' | 'curl'
type ShellType = 'bash' | 'powershell'

const ENGINE_URL =
  process.env['NEXT_PUBLIC_ENGINE_URL'] ?? 'http://localhost:3001'

function generatePowerShellSnippet(serviceId: string): string {
  const sid = serviceId || 'my-service'
  return `# Send a health signal (no SDK required)
# Set $env:BIONIC_ENGINE_TOKEN if your Engine requires authentication.
# Drop the Authorization entry from the Headers hashtable if not set.

$body = @{
  event = @{
    id          = "test-$([guid]::NewGuid())"
    projectId   = "project_bionic"
    serviceId   = "${sid}"
    type        = "service.health.reported"
    source      = "sdk"
    occurredAt  = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    payload     = @{ status = "ok" }
  }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "${ENGINE_URL}/api/events" \`
  -Method POST \`
  -Headers @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $env:BIONIC_ENGINE_TOKEN"
  } \`
  -Body $body

# Report an error
$errBody = @{
  event = @{
    id          = "err-$([guid]::NewGuid())"
    projectId   = "project_bionic"
    serviceId   = "${sid}"
    type        = "service.error.reported"
    source      = "sdk"
    occurredAt  = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    payload     = @{ code = "ERR_CODE"; message = "What happened" }
  }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "${ENGINE_URL}/api/events" \`
  -Method POST \`
  -Headers @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $env:BIONIC_ENGINE_TOKEN"
  } \`
  -Body $errBody`
}

function generateCurlSnippet(serviceId: string): string {
  const sid = serviceId || 'my-service'
  return `# Send a health signal (no SDK required)
# Set BIONIC_ENGINE_TOKEN if your Engine requires authentication.
# Remove the Authorization header if BIONIC_ENGINE_TOKEN is not set.

curl -X POST ${ENGINE_URL}/api/events \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $BIONIC_ENGINE_TOKEN" \\
  -d '{
    "event": {
      "id": "'"test-$(date +%s)-$RANDOM"'",
      "projectId": "project_bionic",
      "serviceId": "${sid}",
      "type": "service.health.reported",
      "source": "sdk",
      "occurredAt": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'",
      "payload": { "status": "ok" }
    }
  }'

# Report an error
curl -X POST ${ENGINE_URL}/api/events \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $BIONIC_ENGINE_TOKEN" \\
  -d '{
    "event": {
      "id": "'"err-$(date +%s)-$RANDOM"'",
      "projectId": "project_bionic",
      "serviceId": "${sid}",
      "type": "service.error.reported",
      "source": "sdk",
      "occurredAt": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'",
      "payload": { "code": "ERR_CODE", "message": "What happened" }
    }
  }'`
}

function generateSnippet(serviceId: string, framework: Framework): string {
  const sid = serviceId || 'my-service'
  const client = `import { BionicClient } from '@bionic/sdk'

export const bionic = new BionicClient({
  engineUrl: process.env.BIONIC_ENGINE_URL ?? 'http://localhost:3001',
  token: process.env.BIONIC_ENGINE_TOKEN,
  projectId: 'project_bionic',
  serviceId: '${sid}',
})`

  if (framework === 'nextjs') {
    return `${client}

// src/app/api/health/route.ts
export async function GET() {
  try {
    // your health check logic
    void bionic.health({ status: 'ok' })
    return Response.json({ status: 'ok' })
  } catch (error) {
    void bionic.error({
      code: 'HEALTH_CHECK_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    void bionic.health({ status: 'degraded', reason: 'health_check_failed' })
    return Response.json({ status: 'error' }, { status: 500 })
  }
}`
  }

  if (framework === 'express') {
    return `${client}

// middleware/bionic.ts
app.use((req, res, next) => {
  res.on('finish', () => {
    void bionic.usage({ requestCount: 1, endpoint: req.path })
    if (res.statusCode >= 500) {
      void bionic.error({
        code: 'SERVER_ERROR',
        message: \`\${req.method} \${req.path} returned \${res.statusCode}\`,
      })
    }
  })
  next()
})`
  }

  return `${client}

// Report health
void bionic.health({ status: 'ok' })

// Report errors
void bionic.error({ code: 'ERROR_CODE', message: 'What happened' })

// Report usage
void bionic.usage({ requestCount: 1 })`
}

export default function AddServicePage({
  searchParams,
}: {
  searchParams: { serviceId?: string }
}) {
  const [serviceId, setServiceId] = useState(searchParams.serviceId ?? '')
  const [installMethod, setInstallMethod] = useState<InstallMethod>('curl')
  const [shellType, setShellType] = useState<ShellType>('bash')
  const [framework, setFramework] = useState<Framework>('nextjs')
  const [testResult, setTestResult] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle')
  const [testError, setTestError] = useState<string | null>(null)
  const [showWebhooks, setShowWebhooks] = useState(false)

  const snippet =
    installMethod === 'curl'
      ? shellType === 'powershell'
        ? generatePowerShellSnippet(serviceId)
        : generateCurlSnippet(serviceId)
      : generateSnippet(serviceId, framework)
  const trimmed = serviceId.trim()
  const isValid = trimmed.length > 0 && /^[a-z0-9-]+$/.test(trimmed)

  async function handleTestEvent() {
    if (!isValid) return
    setTestResult('sending')
    setTestError(null)
    const result = await sendTestServiceEvent(trimmed)
    if (result.ok) {
      setTestResult('success')
    } else {
      setTestResult('error')
      setTestError(result.error ?? 'unknown error')
    }
  }

  const sidOrPlaceholder = serviceId || 'my-service'
  const webhookItems = [
    {
      name: 'Vercel',
      key: 'BIONIC_VERCEL_PROJECT_MAP',
      value: `prj_xxx:${sidOrPlaceholder}`,
      hint: 'Replace prj_xxx with your Vercel Project ID. Multiple entries are comma-separated (prj_a:svc-a,prj_b:svc-b).',
    },
    {
      name: 'GitHub',
      key: 'BIONIC_GITHUB_REPO_MAP',
      value: `owner/repo:${sidOrPlaceholder}`,
      hint: 'Replace owner/repo with the GitHub repository (e.g. acme/api). Multiple entries are comma-separated.',
    },
    {
      name: 'Stripe',
      key: 'BIONIC_STRIPE_SERVICE_ID',
      value: sidOrPlaceholder,
      hint: 'All Stripe webhook events are attributed to this service id.',
    },
    {
      name: 'Sentry',
      key: 'BIONIC_SENTRY_SERVICE_ID',
      value: sidOrPlaceholder,
      hint: 'All Sentry webhook events are attributed to this service id.',
    },
  ]

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary uppercase tracking-wide">
          Add Service
        </h1>
        <p className="font-mono text-xs text-text-muted mt-1">
          Connect your app to Bionic · Start with one signal
        </p>
      </div>

      {/* Step 1: Service ID */}
      <div className="bg-bg-surface border border-border-subtle rounded p-5 mb-4">
        <div className="font-mono text-xs text-text-secondary uppercase tracking-widest mb-3">
          01 · Name your service
        </div>
        <p className="font-body text-xs text-text-muted mb-3">
          A service is any app or API that Bionic will watch. Use lowercase
          kebab-case (e.g. medini-api, checkout-worker).
        </p>
        <input
          type="text"
          value={serviceId}
          onChange={(e) =>
            setServiceId(
              e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
            )
          }
          placeholder="my-service"
          className="w-full font-mono text-sm bg-bg-base border border-border-default rounded px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
        {serviceId && !isValid && (
          <p className="font-mono text-xs text-status-critical mt-1">
            Use lowercase letters, numbers, and hyphens only.
          </p>
        )}
      </div>

      {/* Step 2: Integration method */}
      <div className="bg-bg-surface border border-border-subtle rounded p-5 mb-4">
        <div className="font-mono text-xs text-text-secondary uppercase tracking-widest mb-3">
          02 · Choose how to integrate
        </div>
        <div className="flex gap-2 flex-wrap mb-4">
          {(['curl', 'sdk'] as InstallMethod[]).map((m) => (
            <button
              key={m}
              onClick={() => setInstallMethod(m)}
              className={`font-mono text-xs px-4 py-2 rounded border transition-colors ${
                installMethod === m
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border-subtle text-text-secondary hover:border-accent/50'
              }`}
            >
              {m === 'curl'
                ? 'Direct API (recommended)'
                : 'TypeScript SDK (advanced)'}
            </button>
          ))}
        </div>
        {installMethod === 'sdk' && (
          <div className="flex gap-2 flex-wrap">
            {(['nextjs', 'express', 'other'] as Framework[]).map((fw) => (
              <button
                key={fw}
                onClick={() => setFramework(fw)}
                className={`font-mono text-xs px-4 py-2 rounded border transition-colors ${
                  framework === fw
                    ? 'border-accent text-accent bg-accent/10'
                    : 'border-border-subtle text-text-secondary hover:border-accent/50'
                }`}
              >
                {fw === 'nextjs'
                  ? 'Next.js'
                  : fw === 'express'
                    ? 'Express'
                    : 'Other'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 3: Install / wire up */}
      <div className="bg-bg-surface border border-border-subtle rounded p-5 mb-4">
        <div className="font-mono text-xs text-text-secondary uppercase tracking-widest mb-3">
          03 · {installMethod === 'sdk' ? 'Install SDK' : 'Send signals via curl'}
        </div>

        {installMethod === 'sdk' ? (
          <div className="bg-bg-elevated border border-border-subtle rounded p-5">
            <div className="font-mono text-xs text-status-info uppercase tracking-widest mb-2">
              Coming Soon
            </div>
            <p className="font-body text-sm text-text-secondary mb-3">
              The Bionic SDK will be published to npm in a future release.
            </p>
            <p className="font-body text-xs text-text-muted">
              For now, use the{' '}
              <button
                onClick={() => setInstallMethod('curl')}
                className="text-accent hover:underline font-mono"
              >
                Direct API
              </button>{' '}
              option to connect your service.
            </p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 flex-wrap mb-3">
              {(['bash', 'powershell'] as ShellType[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setShellType(s)}
                  className={`font-mono text-xs px-4 py-2 rounded border transition-colors ${
                    shellType === s
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border-subtle text-text-secondary hover:border-accent/50'
                  }`}
                >
                  {s === 'bash' ? 'Bash (macOS / Linux / WSL)' : 'PowerShell (Windows)'}
                </button>
              ))}
            </div>
            <p className="font-body text-xs text-text-muted mb-3">
              No SDK required. Any HTTP client works. The snippet computes{' '}
              <code className="text-accent">occurredAt</code> at runtime.
            </p>
            <div className="bg-bg-base border border-border-subtle rounded p-3 overflow-x-auto">
              <pre className="font-mono text-xs text-text-primary whitespace-pre">
                {snippet}
              </pre>
            </div>
          </>
        )}
      </div>

      {/* Step 4: Test Event */}
      <div className="bg-bg-surface border border-border-subtle rounded p-5 mb-4">
        <div className="font-mono text-xs text-text-secondary uppercase tracking-widest mb-3">
          04 · Send a test signal
        </div>
        <p className="font-body text-xs text-text-muted mb-4">
          Confirm Bionic can receive signals from your service. Your service
          will appear in the Services list after the first signal.
        </p>
        <button
          onClick={handleTestEvent}
          disabled={!isValid || testResult === 'sending'}
          className="font-mono text-xs uppercase tracking-widest px-4 py-2 bg-accent text-text-inverse rounded hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testResult === 'sending' ? 'Sending...' : 'Send test signal'}
        </button>

        {testResult === 'success' && (
          <div className="mt-3 font-mono text-xs text-status-success">
            ◈ Signal received. Your service will now appear in Services.
          </div>
        )}
        {testResult === 'error' && (
          <div className="mt-3 font-mono text-xs text-status-critical">
            Failed to send signal
            {testError ? `: ${testError}` : '.'} Make sure the Engine is
            running.
          </div>
        )}
      </div>

      {/* Optional webhooks */}
      <div className="bg-bg-surface border border-border-subtle rounded p-5 mb-6">
        <button
          onClick={() => setShowWebhooks(!showWebhooks)}
          className="font-mono text-xs text-text-secondary uppercase tracking-widest w-full text-left"
        >
          {showWebhooks ? '▾' : '▸'} Optional · Connect webhooks
        </button>
        {showWebhooks && (
          <div className="mt-4 space-y-4">
            <p className="font-body text-xs text-text-muted">
              Add these to your .env.local to connect external services.
              Replace{' '}
              <code className="text-accent">
                {serviceId || 'my-service'}
              </code>{' '}
              with your service ID.
            </p>
            {webhookItems.map((item) => (
              <div key={item.name}>
                <div className="font-mono text-xs text-text-secondary mb-1">
                  {item.name}
                </div>
                <div className="bg-bg-base border border-border-subtle rounded p-2 overflow-x-auto">
                  <code className="font-mono text-xs text-text-primary whitespace-nowrap">
                    {item.key}={item.value}
                  </code>
                </div>
                <p className="font-mono text-xs text-text-muted mt-1">
                  {item.hint}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {testResult === 'success' && (
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/services"
            className="font-mono text-xs uppercase tracking-widest px-4 py-2 bg-accent text-text-inverse rounded hover:bg-accent-hover transition-colors"
          >
            View Services →
          </Link>
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-border-default text-text-secondary rounded hover:border-accent hover:text-accent transition-colors"
          >
            Open Dashboard
          </Link>
        </div>
      )}
    </div>
  )
}
