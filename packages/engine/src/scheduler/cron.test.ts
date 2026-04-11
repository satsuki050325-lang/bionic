import { describe, it, expect } from 'vitest'
import { validateCronExpression } from './cron.js'

describe('validateCronExpression', () => {
  it('有効なcron式を受け入れる', () => {
    expect(validateCronExpression('0 9 * * 1')).toBe(true)
    expect(validateCronExpression('59 23 * * 6')).toBe(true)
    expect(validateCronExpression('0 0 * * 0')).toBe(true)
  })

  it('分が範囲外の場合はfalseを返す', () => {
    expect(validateCronExpression('60 9 * * 1')).toBe(false)
  })

  it('時が範囲外の場合はfalseを返す', () => {
    expect(validateCronExpression('0 24 * * 1')).toBe(false)
  })

  it('曜日が範囲外の場合はfalseを返す', () => {
    expect(validateCronExpression('0 9 * * 7')).toBe(false)
  })

  it('範囲指定を拒否する', () => {
    expect(validateCronExpression('0 9-17 * * 1')).toBe(false)
  })

  it('英数字混在を拒否する', () => {
    expect(validateCronExpression('0 9abc * * 1')).toBe(false)
  })

  it('曜日にワイルドカードを拒否する', () => {
    expect(validateCronExpression('0 9 * * *')).toBe(false)
  })

  it('フィールド数が多い場合はfalseを返す', () => {
    expect(validateCronExpression('0 9 * * 1 2')).toBe(false)
  })

  it('dom/monthが*以外の場合はfalseを返す', () => {
    expect(validateCronExpression('0 9 1 * 1')).toBe(false)
  })
})
