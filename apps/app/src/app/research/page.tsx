import { getResearchItems } from '@/lib/engine'
import { saveResearchItem } from './actions'

export default async function ResearchPage() {
  const result = await getResearchItems('project_bionic')

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-accent font-heading text-4xl">&#9670;</div>
        <h1 className="font-heading text-2xl font-semibold">Engine Offline</h1>
        <p className="text-text-secondary font-mono text-sm">
          Run <span className="text-accent">pnpm --filter @bionic/engine dev</span> to start
        </p>
      </div>
    )
  }

  const items = result.items

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text-primary uppercase tracking-wide">
          Research
        </h1>
        <p className="font-mono text-xs text-text-muted mt-1">
          Weekly digest inputs · {items.length} saved
        </p>
      </div>

      {/* Saved items (primary) */}
      {items.length === 0 ? (
        <div className="bg-bg-surface border border-border-subtle rounded p-12 text-center">
          <div className="font-mono text-3xl text-accent mb-3">◈</div>
          <p className="text-text-secondary font-mono text-sm">
            No research items saved yet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-bg-surface border border-border-subtle border-l-2 border-l-accent rounded p-4"
            >
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="badge-muted">{item.importanceScore}</span>
                  <span className="font-heading font-semibold text-sm text-text-primary">
                    {item.title}
                  </span>
                  {item.category && (
                    <span className="badge-muted">{item.category}</span>
                  )}
                </div>
                <span className="font-mono text-xs text-text-muted shrink-0">
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-text-secondary text-sm mb-1">{item.summary}</p>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent font-mono text-xs hover:underline break-all"
                >
                  {item.url}
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add form (collapsible, below list) */}
      <details className="mt-6 bg-bg-surface border border-border-subtle rounded p-4">
        <summary className="font-mono text-xs text-text-secondary uppercase tracking-widest cursor-pointer hover:text-text-primary">
          + Add Research Item
        </summary>
        <form action={saveResearchItem} className="space-y-4 mt-4">
          <div className="space-y-1">
            <label
              htmlFor="title"
              className="font-mono text-xs text-text-secondary"
            >
              TITLE *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="w-full bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="summary"
              className="font-mono text-xs text-text-secondary"
            >
              SUMMARY *
            </label>
            <textarea
              id="summary"
              name="summary"
              rows={4}
              required
              className="w-full bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none resize-y"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="url"
                className="font-mono text-xs text-text-secondary"
              >
                URL
              </label>
              <input
                id="url"
                name="url"
                type="url"
                className="w-full bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="category"
                className="font-mono text-xs text-text-secondary"
              >
                CATEGORY
              </label>
              <input
                id="category"
                name="category"
                type="text"
                placeholder="AI / market / tools"
                className="w-full bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="importanceScore"
                className="font-mono text-xs text-text-secondary"
              >
                IMPORTANCE (0-100) *
              </label>
              <input
                id="importanceScore"
                name="importanceScore"
                type="number"
                min="0"
                max="100"
                defaultValue="50"
                required
                className="w-full bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-accent hover:bg-accent-hover text-text-inverse font-mono text-sm uppercase tracking-widest px-4 py-2 rounded transition-colors"
          >
            Save
          </button>
        </form>
      </details>
    </div>
  )
}
