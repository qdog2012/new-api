/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { describe, expect, it } from 'vitest'

import type { QuotaDataItem } from '@/features/dashboard/types'

import { processTokenChartData } from '../token-chart-data'

const identity = (key: string) => key

interface ChartDatum {
  Time: string
  Model: string
  Tokens: number
}

function getValues(spec: Record<string, unknown>): ChartDatum[] {
  const data = spec.data as Array<{ values: ChartDatum[] }> | undefined
  return data?.[0]?.values ?? []
}

function makeItem(overrides: Partial<QuotaDataItem>): QuotaDataItem {
  return { created_at: 1_700_000_000, ...overrides }
}

describe('processTokenChartData', () => {
  it('returns zero total and empty series when there is no data', () => {
    const result = processTokenChartData([], 'day', identity, 'en-US')

    expect(result.totalTokens).toBe(0)
    expect(result.totalTokensDisplay).toBe('0')
    expect(getValues(result.specBar)).toEqual([])
    expect(getValues(result.specArea)).toEqual([])
  })

  it('sums token_used per model and ignores the quota (money) field', () => {
    const data = [
      makeItem({ model_name: 'gpt-4o', token_used: 100, quota: 999999 }),
      makeItem({ model_name: 'gpt-4o', token_used: 50 }),
      makeItem({
        model_name: 'claude',
        token_used: 30,
        created_at: 1_700_086_400,
      }),
    ]

    const result = processTokenChartData(data, 'day', identity, 'en-US')

    expect(result.totalTokens).toBe(180)
    const values = getValues(result.specBar)
    expect(values).toContainEqual({
      Time: expect.any(String),
      Model: 'gpt-4o',
      Tokens: 150,
    })
    expect(values).toContainEqual({
      Time: expect.any(String),
      Model: 'claude',
      Tokens: 30,
    })
  })

  it('folds models beyond the series limit into a single Other bucket', () => {
    const data = Array.from({ length: 14 }, (_, index) =>
      makeItem({ model_name: `model-${index}`, token_used: index + 1 })
    )

    const result = processTokenChartData(data, 'day', identity, 'en-US')

    expect(result.totalTokens).toBe(105)
    const models = new Set(
      getValues(result.specBar).map((value) => value.Model)
    )
    expect(models.has('Other')).toBe(true)
    expect(models.size).toBe(13)
  })
})
