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
import { getDashboardChartColors } from '@/features/dashboard/lib/charts'
import type { QuotaDataItem } from '@/features/dashboard/types'
import { formatCompactNumber, formatNumber } from '@/lib/format'
import { formatChartTime, type TimeGranularity } from '@/lib/time'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VChartSpec = Record<string, any>

type TFunction = (key: string) => string

interface TokenChartDatum {
  Time: string
  Model: string
  Tokens: number
}

export interface ProcessedTokenChartData {
  specBar: VChartSpec
  specArea: VChartSpec
  totalTokens: number
  totalTokensDisplay: string
}

const MAX_SERIES_MODELS = 12
const UNKNOWN_MODEL = 'Unknown'

/**
 * Aggregate /api/data rows by TOKEN count (token_used) instead of quota.
 * quota (money) and count (requests) are deliberately ignored here so the
 * resulting charts never expose a currency value.
 */
export function processTokenChartData(
  data: QuotaDataItem[],
  timeGranularity: TimeGranularity,
  t: TFunction,
  locale: Intl.LocalesArgument
): ProcessedTokenChartData {
  const otherLabel = t('Other')
  const timeModelMap = new Map<string, Map<string, number>>()
  const modelTotals = new Map<string, number>()
  const timeOrder = new Map<string, number>()

  for (const item of data) {
    const timestamp = Number(item.created_at)
    if (!Number.isFinite(timestamp)) continue
    const timeKey = formatChartTime(timestamp, timeGranularity)
    timeOrder.set(
      timeKey,
      Math.min(timeOrder.get(timeKey) ?? timestamp, timestamp)
    )
    const model = item.model_name || UNKNOWN_MODEL
    const tokens = Number(item.token_used) || 0
    let modelMap = timeModelMap.get(timeKey)
    if (!modelMap) {
      modelMap = new Map<string, number>()
      timeModelMap.set(timeKey, modelMap)
    }
    modelMap.set(model, (modelMap.get(model) ?? 0) + tokens)
    modelTotals.set(model, (modelTotals.get(model) ?? 0) + tokens)
  }

  const times = [...timeOrder.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => key)
  const rankedModels = [...modelTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([model]) => model)
  const topModels = rankedModels.slice(0, MAX_SERIES_MODELS)
  const overflowModels = rankedModels.slice(MAX_SERIES_MODELS)
  const seriesModels =
    overflowModels.length > 0 ? [...topModels, otherLabel] : topModels
  const modelColor = {
    type: 'ordinal',
    domain: seriesModels,
    range: getDashboardChartColors(seriesModels.length),
  }

  const values: TokenChartDatum[] = []
  for (const timeKey of times) {
    const modelMap = timeModelMap.get(timeKey)
    for (const model of topModels) {
      values.push({
        Time: timeKey,
        Model: model,
        Tokens: modelMap?.get(model) ?? 0,
      })
    }
    if (overflowModels.length > 0) {
      const other = overflowModels.reduce(
        (sum, model) => sum + (modelMap?.get(model) ?? 0),
        0
      )
      values.push({ Time: timeKey, Model: otherLabel, Tokens: other })
    }
  }

  const totalTokens = [...modelTotals.values()].reduce((sum, v) => sum + v, 0)
  const formatValue = (value: number) => formatNumber(value, locale)
  const tooltipContent = [
    {
      key: (datum: Record<string, unknown>) => datum?.Model,
      value: (datum: Record<string, unknown>) =>
        formatValue(Number(datum?.Tokens) || 0),
    },
  ]

  const specBar: VChartSpec = {
    type: 'bar',
    data: [{ id: 'tokenBarData', values }],
    xField: 'Time',
    yField: 'Tokens',
    seriesField: 'Model',
    stack: true,
    legends: { visible: true, selectMode: 'single' },
    color: modelColor,
    tooltip: { mark: { content: tooltipContent } },
    background: { fill: 'transparent' },
    animation: true,
  }

  const specArea: VChartSpec = {
    type: 'area',
    data: [{ id: 'tokenAreaData', values }],
    xField: 'Time',
    yField: 'Tokens',
    seriesField: 'Model',
    stack: true,
    legends: { visible: true, selectMode: 'single' },
    color: modelColor,
    tooltip: { mark: { content: tooltipContent } },
    area: { style: { fillOpacity: 0.12, curveType: 'monotone' } },
    line: { style: { lineWidth: 2, curveType: 'monotone' } },
    point: { visible: false },
    background: { fill: 'transparent' },
    animation: true,
  }

  return {
    specBar,
    specArea,
    totalTokens,
    totalTokensDisplay:
      totalTokens > 999_999
        ? formatCompactNumber(totalTokens, locale)
        : formatValue(totalTokens),
  }
}
