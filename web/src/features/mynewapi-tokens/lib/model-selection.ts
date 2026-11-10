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
import type { QuotaDataItem } from '@/features/dashboard/types'

// Fork-owned key (never shared with upstream dashboard preferences) so the
// saved selection cannot collide with a future upstream storage key.
export const SELECTED_MODELS_STORAGE_KEY = 'mynewapi_tokens_selected_models'

/**
 * Load the saved model selection. Returns null when nothing has been saved
 * yet, which callers treat as "select every model" (the default).
 */
export function loadSelectedModels(): string[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SELECTED_MODELS_STORAGE_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.filter((value): value is string => typeof value === 'string')
  } catch {
    return null
  }
}

export function saveSelectedModels(models: string[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    SELECTED_MODELS_STORAGE_KEY,
    JSON.stringify(models)
  )
}

export function collectModelNames(rows: QuotaDataItem[]): string[] {
  const names = new Set<string>()
  for (const row of rows) {
    if (row.model_name) names.add(row.model_name)
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

export function mergeModelOptions(
  channelModels: string[] | undefined,
  dataModels: string[]
): string[] {
  const merged = new Set<string>()
  for (const name of channelModels ?? []) {
    if (name) merged.add(name)
  }
  for (const name of dataModels) {
    if (name) merged.add(name)
  }
  return [...merged].sort((a, b) => a.localeCompare(b))
}

export function filterRowsByModels(
  rows: QuotaDataItem[],
  selected: ReadonlySet<string>
): QuotaDataItem[] {
  return rows.filter((row) => selected.has(row.model_name ?? ''))
}
