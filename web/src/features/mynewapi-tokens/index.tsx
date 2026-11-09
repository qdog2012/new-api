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

import { TokenCharts } from './token-charts'
import { TokenStatCards } from './token-stat-cards'

/**
 * Token-based sibling of the models dashboard section. It reuses the very
 * same /api/data payload but every metric is derived from token counts
 * (token_used + cache tokens), never from quota (money).
 */
export function TokenUsageDashboard() {
  const userRole = useAuthStore((state) => state.auth.user?.role)
  const isAdmin = Boolean(userRole && userRole >= ROLE.ADMIN)
  const [filters, setFilters] = useState<DashboardFilters>(() =>
    buildDefaultDashboardFilters(DEFAULT_DASHBOARD_CHART_PREFERENCES)
  )

  const handleFilterChange = useCallback((next: DashboardFilters) => {
    setFilters(next)
  }, [])

  const handleResetFilters = useCallback(() => {
    setFilters(
      buildDefaultDashboardFilters(DEFAULT_DASHBOARD_CHART_PREFERENCES)
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

  const rows = data ?? []

  return (
    <div className='space-y-3 sm:space-y-4'>
      <div className='flex justify-end'>
        <ModelsFilter
          preferences={DEFAULT_DASHBOARD_CHART_PREFERENCES}
          currentFilters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>
      <FadeIn>
        <TokenStatCards
          data={rows}
          timeRangeMinutes={timeRangeMinutes}
          loading={isLoading}
          error={isError}
        />
      </FadeIn>
      <FadeIn delay={0.05}>
        <TokenCharts
          data={rows}
          loading={isLoading}
          timeGranularity={filters.time_granularity}
        />
      </FadeIn>
    </div>
  )
}
