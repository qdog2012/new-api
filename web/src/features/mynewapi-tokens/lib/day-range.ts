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
import type { DashboardFilters } from '@/features/dashboard/types'
import { getEndOfDay, getStartOfDay } from '@/lib/time'

const DAY_MS = 86_400_000
// Rolling presets produce exact multiple-of-a-day spans, but allow a small
// slack so a range that already sits on day boundaries is still recognised.
const WHOLE_DAY_TOLERANCE_MS = 60_000

// A rolling preset keeps the same wall-clock time on both ends (only the date
// shifts), which lets us tell it apart from a manually picked custom range.
function isRollingDayRange(start: Date, end: Date, spanMs: number): boolean {
  const wholeDays = Math.round(spanMs / DAY_MS)
  if (wholeDays < 1) return false
  if (Math.abs(spanMs - wholeDays * DAY_MS) > WHOLE_DAY_TOLERANCE_MS) {
    return false
  }
  return (
    start.getHours() === end.getHours() &&
    start.getMinutes() === end.getMinutes() &&
    start.getSeconds() === end.getSeconds()
  )
}

/**
 * Build a natural-day range covering "days" days including today: the start is
 * 00:00:00 of the first day and the end is 23:59:59 of today.
 */
export function getNaturalDayRange(
  days: number,
  fromDate: Date = new Date()
): { start: Date; end: Date } {
  const end = getEndOfDay(fromDate)
  const start = getStartOfDay(fromDate)
  start.setDate(start.getDate() - Math.max(0, days - 1))
  return { start, end }
}

/**
 * Snap a token dashboard filter range to natural day boundaries: the start
 * becomes 00:00:00 and the end becomes 23:59:59.
 *
 * Rolling presets (including the default) cover "N days including today", so
 * picking "1 Day" shows today only instead of the previous 24 hours. A custom
 * range keeps the days the user picked and only has its clock time normalised.
 */
export function snapFiltersToNaturalDays(
  filters: DashboardFilters
): DashboardFilters {
  const start = filters.start_timestamp
  const end = filters.end_timestamp
  if (!(start instanceof Date) || !(end instanceof Date)) return filters

  const spanMs = end.getTime() - start.getTime()
  const wholeDays = Math.round(spanMs / DAY_MS)
  const startDate = isRollingDayRange(start, end, spanMs)
    ? new Date(end.getTime() - (wholeDays - 1) * DAY_MS)
    : start

  return {
    ...filters,
    start_timestamp: getStartOfDay(startDate),
    end_timestamp: getEndOfDay(end),
  }
}
