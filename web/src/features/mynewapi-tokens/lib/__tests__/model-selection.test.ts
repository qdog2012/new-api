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
import { beforeEach, describe, expect, it } from 'vitest'

import type { QuotaDataItem } from '@/features/dashboard/types'

import {
  SELECTED_MODELS_STORAGE_KEY,
  collectModelNames,
  filterRowsByModels,
  loadSelectedModels,
  mergeModelOptions,
  saveSelectedModels,
} from '../model-selection'

function makeRow(modelName: string): QuotaDataItem {
  return { model_name: modelName, created_at: 1_700_000_000 }
}

describe('model selection storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns null when nothing has been saved yet', () => {
    expect(loadSelectedModels()).toBeNull()
  })

  it('round-trips the saved selection through localStorage', () => {
    saveSelectedModels(['gpt-4o', 'claude'])
    expect(window.localStorage.getItem(SELECTED_MODELS_STORAGE_KEY)).toBe(
      '["gpt-4o","claude"]'
    )
    expect(loadSelectedModels()).toEqual(['gpt-4o', 'claude'])
  })

  it('ignores malformed stored values', () => {
    window.localStorage.setItem(SELECTED_MODELS_STORAGE_KEY, 'not-json')
    expect(loadSelectedModels()).toBeNull()
    window.localStorage.setItem(SELECTED_MODELS_STORAGE_KEY, '{"a":1}')
    expect(loadSelectedModels()).toBeNull()
  })
})

describe('model option helpers', () => {
  it('collects distinct model names sorted alphabetically', () => {
    const rows = [makeRow('zeta'), makeRow('alpha'), makeRow('zeta')]
    expect(collectModelNames(rows)).toEqual(['alpha', 'zeta'])
  })

  it('merges channel models with models seen in the data', () => {
    expect(
      mergeModelOptions(['b-model', 'a-model'], ['c-model', 'a-model'])
    ).toEqual(['a-model', 'b-model', 'c-model'])
    expect(mergeModelOptions(undefined, ['only-data'])).toEqual(['only-data'])
  })

  it('keeps only the selected models', () => {
    const rows = [makeRow('a'), makeRow('b'), makeRow('c')]
    expect(
      filterRowsByModels(rows, new Set(['a', 'c'])).map((row) => row.model_name)
    ).toEqual(['a', 'c'])
    expect(filterRowsByModels(rows, new Set())).toEqual([])
  })
})
