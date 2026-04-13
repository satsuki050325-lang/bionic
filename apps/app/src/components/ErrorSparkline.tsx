import type { EventMetricPoint } from '@/lib/engine'

export function ErrorSparkline({ points }: { points: EventMetricPoint[] }) {
  if (!points || points.length === 0) return null

  const maxVal = Math.max(
    ...points.map((p) => p.errors + p.healthDegraded),
    1
  )
  const width = 120
  const height = 32
  const barWidth = Math.max(1, Math.floor(width / points.length) - 1)

  return (
    <svg
      width={width}
      height={height}
      className="opacity-60"
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
                className="fill-status-warning"
                opacity={0.6}
              />
            )}
            {errorHeight > 0 && (
              <rect
                x={x}
                y={height - errorHeight}
                width={barWidth}
                height={errorHeight}
                className="fill-status-critical"
                opacity={0.85}
              />
            )}
            {errorHeight === 0 && degradedHeight === 0 && (
              <rect
                x={x}
                y={height - 2}
                width={barWidth}
                height={2}
                className="fill-border-subtle"
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}
