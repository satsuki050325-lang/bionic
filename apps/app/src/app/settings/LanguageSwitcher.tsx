'use client'

import { useState } from 'react'

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const [locale, setLocale] = useState(currentLocale)

  function switchLocale(newLocale: string) {
    document.cookie = `bionic-locale=${newLocale};path=/;max-age=31536000`
    setLocale(newLocale)
    window.location.reload()
  }

  return (
    <div className="flex gap-2">
      {(['en', 'ja'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchLocale(l)}
          className={`font-mono text-xs px-3 py-1 rounded border transition-colors ${
            locale === l
              ? 'border-accent text-accent bg-accent/10'
              : 'border-border-subtle text-text-secondary hover:border-accent/50'
          }`}
        >
          {l === 'en' ? 'English' : '日本語'}
        </button>
      ))}
    </div>
  )
}
