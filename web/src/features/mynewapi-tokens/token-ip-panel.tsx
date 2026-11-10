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
import { RefreshCw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toIntlLocale } from '@/i18n/languages'
import { formatCompactNumber, formatNumber } from '@/lib/format'
import { requireServerSuccess } from '@/lib/server-error-message'

import { getIpTokenStats } from './lib/ip-stats-api'

interface TokenIpPanelProps {
  startTimestamp?: Date
  endTimestamp?: Date
}

interface IpStatsRequest {
  start_timestamp: number
  end_timestamp: number
  nonce: number
}

function toUnixSeconds(date: Date | undefined, fallback: number): number {
  return date instanceof Date ? Math.floor(date.getTime() / 1000) : fallback
}

/**
 * On-demand token usage grouped by client IP. Nothing is queried until the
 * user presses Query, because aggregating the log table is expensive.
 */
export function TokenIpPanel(props: TokenIpPanelProps) {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const [request, setRequest] = useState<IpStatsRequest | null>(null)

  const handleQuery = useCallback(() => {
    const now = Math.floor(Date.now() / 1000)
    setRequest({
      start_timestamp: toUnixSeconds(props.startTimestamp, now - 24 * 3600),
      end_timestamp: toUnixSeconds(props.endTimestamp, now),
      nonce: Date.now(),
    })
  }, [props.startTimestamp, props.endTimestamp])

  const { data, isFetching, isError } = useQuery({
    queryKey: ['mynewapi', 'tokens', 'ip-stats', request],
    queryFn: async () => {
      if (!request) return { success: true, data: [] }
      return requireServerSuccess(await getIpTokenStats(request))
    },
    enabled: request !== null,
    retry: false,
    staleTime: 0,
  })

  const rows = useMemo(() => data?.data ?? [], [data])
  const formatValue = (value: number) => {
    const fullValue = formatNumber(value, locale)
    return fullValue.length > 9 ? formatCompactNumber(value, locale) : fullValue
  }

  let content
  if (request === null) {
    content = (
      <div className='text-muted-foreground py-10 text-center text-sm'>
        {t('No data available')}
      </div>
    )
  } else if (isFetching && rows.length === 0) {
    content = (
      <div className='space-y-2 py-4'>
        <Skeleton className='h-8 w-full' />
        <Skeleton className='h-8 w-full' />
        <Skeleton className='h-8 w-full' />
      </div>
    )
  } else if (isError || rows.length === 0) {
    content = (
      <div className='text-muted-foreground py-10 text-center text-sm'>
        {t('No data available')}
      </div>
    )
  } else {
    content = (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('IP')}</TableHead>
            <TableHead className='text-right'>{t('Total Tokens')}</TableHead>
            <TableHead className='text-right'>{t('Requests')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.ip}>
              <TableCell className='font-mono'>{row.ip}</TableCell>
              <TableCell
                className='text-right tabular-nums'
                title={formatNumber(row.total_tokens, locale)}
              >
                {formatValue(row.total_tokens)}
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {formatValue(row.count)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className='overflow-hidden rounded-lg border'>
      <div className='flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 sm:px-5 sm:py-3'>
        <div className='text-sm font-semibold'>{t('IP')}</div>
        <Button
          variant='outline'
          size='sm'
          onClick={handleQuery}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4${isFetching ? ' animate-spin' : ''}`}
          />
          {t('Query')}
        </Button>
      </div>
      <div className='p-2 sm:p-3'>{content}</div>
    </div>
  )
}
