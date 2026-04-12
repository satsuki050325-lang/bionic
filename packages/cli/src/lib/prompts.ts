import * as readline from 'readline/promises'
import { stdin as input, stdout as output } from 'process'

let rl: readline.Interface | null = null

function getReadline(): readline.Interface {
  if (!rl) {
    rl = readline.createInterface({ input, output })
  }
  return rl
}

export function closeReadline(): void {
  rl?.close()
  rl = null
}

export async function ask(question: string, defaultValue?: string): Promise<string> {
  const hint = defaultValue ? ` (default: ${defaultValue})` : ''
  const answer = await getReadline().question(`${question}${hint}: `)
  return answer.trim() || defaultValue || ''
}

export async function askYesNo(question: string, defaultValue: boolean): Promise<boolean> {
  const hint = defaultValue ? '[Y/n]' : '[y/N]'
  const answer = await getReadline().question(`${question} ${hint}: `)
  const trimmed = answer.trim().toLowerCase()
  if (!trimmed) return defaultValue
  return trimmed === 'y' || trimmed === 'yes'
}

export async function askChoice(
  question: string,
  choices: string[]
): Promise<string> {
  const hint = choices.join(' / ')
  while (true) {
    const answer = await getReadline().question(`${question} (${hint}): `)
    const trimmed = answer.trim().toLowerCase()
    if (choices.includes(trimmed)) return trimmed
    console.log(`  Please choose one of: ${hint}`)
  }
}
