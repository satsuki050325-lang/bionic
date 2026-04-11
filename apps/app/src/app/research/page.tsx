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

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Research</h1>

      <div className="card space-y-4">
        <div className="font-heading font-semibold text-sm text-text-secondary uppercase tracking-wider">
          Save Research
        </div>
        <form action={saveResearchItem} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="title" className="font-mono text-xs text-text-secondary">TITLE *</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="w-full bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="summary" className="font-mono text-xs text-text-secondary">SUMMARY *</label>
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
              <label htmlFor="url" className="font-mono text-xs text-text-secondary">URL</label>
              <input
                id="url"
                name="url"
                type="url"
                className="w-full bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="category" className="font-mono text-xs text-text-secondary">CATEGORY</label>
              <input
                id="category"
                name="category"
                type="text"
                placeholder="AI / market / tools"
                className="w-full bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="importanceScore" className="font-mono text-xs text-text-secondary">IMPORTANCE (0-100) *</label>
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
            className="bg-accent hover:bg-accent-hover text-white font-mono text-sm px-4 py-2 rounded transition-colors"
          >
            SAVE
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-heading font-semibold text-sm text-text-secondary uppercase tracking-wider">
            Saved Research
          </div>
          <span className="font-mono text-xs text-text-muted">{result.items.length} items</span>
        </div>

        {result.items.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-text-secondary font-mono text-sm">No research items saved yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {result.items.map((item) => (
              <div key={item.id} className="card accent-bar space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="badge-muted">{item.importanceScore}</span>
                    <span className="font-heading font-semibold text-sm">{item.title}</span>
                    {item.category && <span className="badge-muted">{item.category}</span>}
                  </div>
                  <span className="font-mono text-xs text-text-muted shrink-0">
                    {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <p className="text-text-secondary text-sm">{item.summary}</p>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent font-mono text-xs hover:underline"
                  >
                    {item.url}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
