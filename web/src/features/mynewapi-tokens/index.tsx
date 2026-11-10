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
import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'

import { FadeIn } from '@/components/page-transition'
import { getEnabledModels } from '@/features/channels/api'
import { getUserQuotaDates } from '@/features/dashboard/api'
import { ModelsFilter } from '@/features/dashboard/components/models/models-filter-dialog'
import { DEFAULT_DASHBOARD_CHART_PREFERENCES } from '@/features/dashboard/constants'
import {
  buildDefaultDashboardFilters,
  buildQueryParams,
  getDefaultDays,
} from '@/features/dashboard/lib'
import type { DashboardFilters } from '@/features/dashboard/types'
import { ROLE } from '@/lib/roles'
import { requireServerSuccess } from '@/lib/server-error-message'
import { computeTimeRange } from '@/lib/time'
import { useAuthStore } from '@/stores/auth-store'

import { snapFiltersToNaturalDays } from './lib/day-range'
import {
  collectModelNames,
  filterRowsByModels,
  loadSelectedModels,
  mergeModelOptions,
  saveSelectedModels,
} from './lib/model-selection'
import { TokenCharts } from './token-charts'
import { TokenModelFilter } from './token-model-filter'
import { TokenStatCards } from './token-stat-cards'

/**
 * Token-based sibling of the models dashboard section. It reuses the very
 * same /api/data payload but every metric is derived from token counts
 * (token_used + cache tokens), never from quota (money).
 */
export function TokenUsageDashboard() {
  const userRole = useAuthStore((state) => state.auth.user?.role)
  const isAdmin = Boolean(userRole && userRole >= ROLE.ADMIN)
  const [selectedModels, setSelectedModels] = useState<string[] | null>(() =>
    loadSelectedModels()
  )
  const [filters, setFilters] = useState<DashboardFilters>(() =>
    snapFiltersToNaturalDays(
      buildDefaultDashboardFilters(DEFAULT_DASHBOARD_CHART_PREFERENCES)
    )
  )

  const handleFilterChange = useCallback((next: DashboardFilters) => {
    setFilters(snapFiltersToNaturalDays(next))
  }, [])

  const handleResetFilters = useCallback(() => {
    setFilters(
      snapFiltersToNaturalDays(
        buildDefaultDashboardFilters(DEFAULT_DASHBOARD_CHART_PREFERENCES)
      )
    )
  }, [])

  const queryParams = useMemo(() => {
    const timeRange = computeTimeRange(
      getDefaultDays(filters.time_granularity),
      filters.start_timestamp,
      filters.end_timestamp
    )
    return buildQueryParams(timeRange, filters)
  }, [filters])

  const timeRangeMinutes = useMemo(
    () =>
      Math.max(
        1,
        (queryParams.end_timestamp - queryParams.start_timestamp) / 60
      ),
    [queryParams]
  )

  const { data, isLoading, isError } = useQuery({
    queryKey: ['mynewapi', 'tokens', queryParams, isAdmin],
    queryFn: async () =>
      requireServerSuccess(await getUserQuotaDates(queryParams, isAdmin)),
    select: (res) => (res.success ? res.data : []),
    staleTime: 60_000,
  })

  // Channel models need ChannelRead permission; ordinary users get a 403, so
  // failures silently fall back to the models that appear in the data.
  const { data: channelModels } = useQuery({
    queryKey: ['mynewapi', 'tokens', 'channel-models'],
    queryFn: async () => {
      const res = requireServerSuccess(await getEnabledModels())
      return res.success ? (res.data ?? []) : []
    },
    retry: false,
    staleTime: 5 * 60_000,
    meta: { errorToast: false },
  })

  const rows = useMemo(() => data ?? [], [data])
  const modelOptions = useMemo(
    () => mergeModelOptions(channelModels, collectModelNames(rows)),
    [channelModels, rows]
  )
  const effectiveSelectedModels = useMemo(
    () => selectedModels ?? modelOptions,
    [selectedModels, modelOptions]
  )
  const filteredRows = useMemo(
    () => filterRowsByModels(rows, new Set(effectiveSelectedModels)),
    [rows, effectiveSelectedModels]
  )

  const handleModelsChange = useCallback((next: string[]) => {
    setSelectedModels(next)
    saveSelectedModels(next)
  }, [])

  return (
    <div className='space-y-3 sm:space-y-4'>
      <div className='flex flex-col items-end gap-2'>
        <ModelsFilter
          preferences={DEFAULT_DASHBOARD_CHART_PREFERENCES}
          currentFilters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
        <TokenModelFilter
          options={modelOptions}
          selected={effectiveSelectedModels}
          onChange={handleModelsChange}
        />
      </div>
      <FadeIn>
        <TokenStatCards
          data={filteredRows}
          timeRangeMinutes={timeRangeMinutes}
          loading={isLoading}
          error={isError}
        />
      </FadeIn>
      <FadeIn delay={0.05}>
        <TokenCharts
          data={filteredRows}
          loading={isLoading}
          timeGranularity={filters.time_granularity}
        />
      </FadeIn>
    </div>
  )
}
