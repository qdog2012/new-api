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
import { VChart } from '@visactor/react-vchart'
import { Coins } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { IconBadge } from '@/components/ui/icon-badge'
import {
  CONSUMPTION_DISTRIBUTION_CHART_OPTIONS,
  DEFAULT_TIME_GRANULARITY,
} from '@/features/dashboard/constants'
import type { QuotaDataItem } from '@/features/dashboard/types'
import { toIntlLocale } from '@/i18n/languages'
import type { TimeGranularity } from '@/lib/time'
import { useChartTheme } from '@/lib/use-chart-theme'
import { VCHART_OPTION } from '@/lib/vchart'

import { processTokenChartData } from './lib/token-chart-data'

type TokenChartType =
  (typeof CONSUMPTION_DISTRIBUTION_CHART_OPTIONS)[number]['value']

interface TokenChartsProps {
  data: QuotaDataItem[]
  loading?: boolean
  timeGranularity?: TimeGranularity
}

export function TokenCharts(props: TokenChartsProps) {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const { resolvedTheme, themeReady } = useChartTheme()
  const [chartType, setChartType] = useState<TokenChartType>('bar')

  const chartData = useMemo(
    () =>
      processTokenChartData(
        props.loading ? [] : props.data,
        props.timeGranularity ?? DEFAULT_TIME_GRANULARITY,
        t,
        locale
      ),
    [props.data, props.loading, props.timeGranularity, t, locale]
  )

  const spec = chartType === 'bar' ? chartData.specBar : chartData.specArea
  const chartKey = [
    chartType,
    props.loading ? 'loading' : 'ready',
    props.data.length,
    resolvedTheme,
  ].join('-')

  return (
    <div className='overflow-hidden rounded-lg border'>
      <div className='flex w-full flex-col gap-1.5 border-b px-3 py-2 sm:gap-3 sm:px-5 sm:py-3 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex items-center gap-2'>
          <IconBadge tone='success' size='sm'>
            <Coins />
          </IconBadge>
          <div className='text-sm font-semibold'>{t('Total Tokens')}</div>
          <span className='text-muted-foreground text-xs'>
            {t('Total:')} {chartData.totalTokensDisplay}
          </span>
        </div>

        <div className='bg-muted/60 inline-flex h-7 w-full overflow-x-auto rounded-lg border p-0.5 sm:h-8 sm:w-auto'>
          {CONSUMPTION_DISTRIBUTION_CHART_OPTIONS.map((option) => (
            <button
              key={option.value}
              type='button'
              onClick={() => setChartType(option.value)}
              className={`shrink-0 rounded-md px-3 text-xs font-medium transition-colors ${
                chartType === option.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className='h-[300px] p-1.5 sm:h-96 sm:p-2'>
        {themeReady && spec && (
          <VChart
            key={chartKey}
            spec={{
              ...spec,
              theme: resolvedTheme === 'dark' ? 'dark' : 'light',
              background: 'transparent',
            }}
            option={VCHART_OPTION}
          />
        )}
      </div>
    </div>
  )
}
