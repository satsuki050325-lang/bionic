import { getResearchItems } from '@/lib/engine'
import { saveResearchItem } from './actions'

export default async function ResearchPage() {
  const result = await getResearchItems('project_bionic')

  if (!result) {
    return (
      <div>
        <h1>Research</h1>
        <p>Engineが起動していません。<code>pnpm --filter @bionic/engine dev</code> で起動してください。</p>
      </div>
    )
  }

  return (
    <div>
      <h1>Research</h1>

      {/* 保存フォーム（Engineが起動している時だけ表示） */}
      <section>
        <h2>リサーチを保存する</h2>
        <form action={saveResearchItem}>
          <div>
            <label htmlFor="title">タイトル *</label>
            <input id="title" name="title" type="text" required />
          </div>
          <div>
            <label htmlFor="summary">内容 *</label>
            <textarea id="summary" name="summary" rows={5} required />
          </div>
          <div>
            <label htmlFor="url">URL</label>
            <input id="url" name="url" type="url" />
          </div>
          <div>
            <label htmlFor="category">カテゴリ</label>
            <input id="category" name="category" type="text" placeholder="AI動向・市場調査・開発ツール等" />
          </div>
          <div>
            <label htmlFor="importanceScore">重要度 (0-100) *</label>
            <input id="importanceScore" name="importanceScore" type="number" min="0" max="100" defaultValue="50" required />
          </div>
          <button type="submit">保存する</button>
        </form>
      </section>

      {/* 一覧表示 */}
      <section>
        <h2>保存済みリサーチ</h2>
        {result.items.length === 0 ? (
          <p>まだリサーチが保存されていません。</p>
        ) : (
          <ul>
            {result.items.map((item) => (
              <li key={item.id}>
                <strong>[{item.importanceScore}] {item.title}</strong>
                {item.category && <span> — {item.category}</span>}
                <p>{item.summary}</p>
                {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>}
                <small>{new Date(item.createdAt).toLocaleDateString('ja-JP')}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
