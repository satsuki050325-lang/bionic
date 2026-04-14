import type { EventMetricPoint } from '@/lib/engine'

export function ErrorSparkline({ points }: { points: EventMetricPoint[] }) {
  const width = 120
  const height = 32

  if (!points || points.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        className="opacity-40"
        aria-label="No recent events"
        role="img"
      >
        <rect
          x={0}
          y={height - 1}
          width={width}
          height={1}
          style={{ fill: 'var(--border-subtle)' }}
        />
      </svg>
    )
  }

  const maxVal = Math.max(
    ...points.map((p) => p.errors + p.healthDegraded),
    1
  )
  const barWidth = Math.max(1, Math.floor(width / points.length) - 1)

  return (
    <svg
      width={width}
      height={height}
      className="opacity-80"
      aria-label="Recent error and health trend"
      role="img"
    >
      {points.map((point, i) => {
        const errorHeight = Math.round((point.errors / maxVal) * height)
        const degradedHeight = Math.round((point.healthDegraded / maxVal) * height)
        const x = i * (barWidth + 1)
        return (
          <g key={point.bucketStart ?? i}>
            {degradedHeight > 0 && (
              <rect
                x={x}
                y={height - errorHeight - degradedHeight}
                width={barWidth}
                height={degradedHeight}
                style={{ fill: 'var(--status-warning)', opacity: 0.65 }}
              />
            )}
            {errorHeight > 0 && (
              <rect
                x={x}
                y={height - errorHeight}
                width={barWidth}
                height={errorHeight}
                style={{ fill: 'var(--status-critical)', opacity: 0.9 }}
              />
            )}
            {errorHeight === 0 && degradedHeight === 0 && (
              <rect
                x={x}
                y={height - 2}
                width={barWidth}
                height={2}
                style={{ fill: 'var(--border-subtle)' }}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}
