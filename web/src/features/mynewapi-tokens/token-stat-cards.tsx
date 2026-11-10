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
import { Coins, Gauge, Hash, Layers, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { IconBadge } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { calculateDashboardStats, safeDivide } from '@/features/dashboard/lib'
import type { QuotaDataItem } from '@/features/dashboard/types'
import { toIntlLocale } from '@/i18n/languages'
import { formatCompactNumber, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

interface TokenStatCardsProps {
  data: QuotaDataItem[]
  timeRangeMinutes: number
  loading?: boolean
  error?: boolean
}

const MAX_INLINE_STAT_CHARS = 7

function formatTokenValue(value: number, locale: Intl.LocalesArgument) {
  const fullValue = formatNumber(value, locale)
  const displayValue =
    fullValue.length > MAX_INLINE_STAT_CHARS
      ? formatCompactNumber(value, locale)
      : fullValue
  return { displayValue, fullValue }
}

export function TokenStatCards(props: TokenStatCardsProps) {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const stats = calculateDashboardStats(props.data)
  const minutes = props.timeRangeMinutes > 0 ? props.timeRangeMinutes : 1

  const items = [
    {
      key: 'tokens',
      title: t('Total Tokens'),
      value: stats.totalTokens,
      icon: Coins,
    },
    {
      key: 'cacheRead',
      title: t('Cache Read'),
      value: stats.totalCacheReadTokens,
      icon: Layers,
    },
    {
      key: 'count',
      title: t('Total Count'),
      value: stats.totalCount,
      icon: Hash,
    },
    {
      key: 'rpm',
      title: t('Average RPM'),
      value: safeDivide(stats.totalCount, minutes, 2),
      icon: Gauge,
    },
    {
      key: 'tpm',
      title: t('Average TPM'),
      value: safeDivide(stats.totalTokens, minutes, 2),
      icon: Zap,
    },
  ]

  return (
    <div className='divide-border/60 grid grid-cols-2 divide-x overflow-hidden rounded-lg border sm:grid-cols-3 lg:grid-cols-5'>
      {items.map((item, index) => {
        const Icon = item.icon
        const formatted = formatTokenValue(item.value, locale)
        let valueContent: ReactNode
        if (props.loading) {
          valueContent = (
            <div className='mt-1 flex flex-col gap-1 sm:mt-2 sm:gap-1.5'>
              <Skeleton className='h-5 w-16 sm:h-7 sm:w-20' />
            </div>
          )
        } else if (props.error) {
          valueContent = (
            <div className='text-muted-foreground mt-1 font-mono text-base leading-tight font-bold tabular-nums sm:mt-2 sm:text-2xl sm:leading-normal'>
              --
            </div>
          )
        } else {
          valueContent = (
            <div
              className='text-foreground mt-1 max-w-full truncate font-mono text-base leading-tight font-bold tracking-tight tabular-nums sm:mt-2 sm:text-2xl sm:leading-normal'
              title={formatted.fullValue}
            >
              {formatted.displayValue}
            </div>
          )
        }
        return (
          <div
            key={item.key}
            role='group'
            aria-label={item.title}
            aria-busy={props.loading}
            className={cn(
              'min-w-0 px-2.5 py-1.5 sm:px-3 sm:py-4 xl:px-4',
              index === items.length - 1 &&
                items.length % 2 !== 0 &&
                'col-span-2 sm:col-span-1'
            )}
          >
            <div className='flex min-w-0 items-center gap-1.5 sm:gap-2'>
              <IconBadge
                tone='chart-4'
                size='stat'
                className='size-4 rounded-sm sm:size-7 sm:rounded-md [&>svg]:size-2.5 sm:[&>svg]:size-3.5'
              >
                <Icon />
              </IconBadge>
              <div
                className='text-muted-foreground truncate text-[11px] leading-4 font-medium tracking-wide uppercase sm:text-xs sm:tracking-wider'
                title={item.title}
              >
                {item.title}
              </div>
            </div>
            {valueContent}
          </div>
        )
      })}
    </div>
  )
}
