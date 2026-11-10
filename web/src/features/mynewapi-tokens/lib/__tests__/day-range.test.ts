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

import type { DashboardFilters } from '@/features/dashboard/types'
import { getRollingDateRange } from '@/lib/time'

import { snapFiltersToNaturalDays } from '../day-range'

function makeFilters(start: Date, end: Date): DashboardFilters {
  return { start_timestamp: start, end_timestamp: end, time_granularity: 'day' }
}

function asDate(value: Date | undefined): Date {
  if (!(value instanceof Date)) throw new Error('expected a Date')
  return value
}

describe('snapFiltersToNaturalDays', () => {
  it('turns the default 1-day rolling range into today 00:00:00 - 23:59:59', () => {
    const now = new Date(2026, 10, 10, 15, 30, 0)
    const { start, end } = getRollingDateRange(1, now)

    const result = snapFiltersToNaturalDays(makeFilters(start, end))
    const startDate = asDate(result.start_timestamp)
    const endDate = asDate(result.end_timestamp)

    expect([
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    ]).toEqual([2026, 10, 10])
    expect([
      startDate.getHours(),
      startDate.getMinutes(),
      startDate.getSeconds(),
    ]).toEqual([0, 0, 0])
    expect([
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
    ]).toEqual([2026, 10, 10])
    expect([
      endDate.getHours(),
      endDate.getMinutes(),
      endDate.getSeconds(),
    ]).toEqual([23, 59, 59])
  })

  it('anchors a 7-day preset to 7 natural days including today', () => {
    const now = new Date(2026, 10, 10, 15, 30, 0)
    const { start, end } = getRollingDateRange(7, now)

    const result = snapFiltersToNaturalDays(makeFilters(start, end))
    const startDate = asDate(result.start_timestamp)
    const endDate = asDate(result.end_timestamp)

    expect([
      startDate.getMonth(),
      startDate.getDate(),
      startDate.getHours(),
    ]).toEqual([10, 4, 0])
    expect([endDate.getMonth(), endDate.getDate(), endDate.getHours()]).toEqual(
      [10, 10, 23]
    )
  })

  it('keeps a custom range start date and only normalises clock times', () => {
    const start = new Date(2026, 10, 1, 10, 20, 30)
    const end = new Date(2026, 10, 5, 18, 40, 10)

    const result = snapFiltersToNaturalDays(makeFilters(start, end))
    const startDate = asDate(result.start_timestamp)
    const endDate = asDate(result.end_timestamp)

    expect([
      startDate.getMonth(),
      startDate.getDate(),
      startDate.getHours(),
      startDate.getMinutes(),
    ]).toEqual([10, 1, 0, 0])
    expect([
      endDate.getMonth(),
      endDate.getDate(),
      endDate.getHours(),
      endDate.getMinutes(),
      endDate.getSeconds(),
    ]).toEqual([10, 5, 23, 59, 59])
  })
})
