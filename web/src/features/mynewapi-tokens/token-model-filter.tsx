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
import { ListFilter, Search } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TokenModelFilterProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

/**
 * Multi-select model filter for the token dashboard. Options come from the
 * channels' enabled models plus any model that already appears in the data.
 */
export function TokenModelFilter(props: TokenModelFilterProps) {
  const { t } = useTranslation()
  const baseId = useId()
  const [query, setQuery] = useState('')

  const selectedSet = useMemo(() => new Set(props.selected), [props.selected])
  const visibleOptions = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return props.options
    return props.options.filter((name) => name.toLowerCase().includes(keyword))
  }, [props.options, query])
  const allVisibleSelected =
    visibleOptions.length > 0 &&
    visibleOptions.every((name) => selectedSet.has(name))

  const toggleModel = (name: string, checked: boolean) => {
    const next = new Set(selectedSet)
    if (checked) next.add(name)
    else next.delete(name)
    props.onChange([...next])
  }

  const toggleVisible = () => {
    const next = new Set(selectedSet)
    for (const name of visibleOptions) {
      if (allVisibleSelected) next.delete(name)
      else next.add(name)
    }
    props.onChange([...next])
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant='outline' size='sm'>
            <ListFilter className='mr-2 h-4 w-4' />
            {t('Models')}
            <span className='text-muted-foreground ml-1.5 text-xs tabular-nums'>
              {props.selected.length}/{props.options.length}
            </span>
          </Button>
        }
      />
      <PopoverContent align='end' className='w-80 gap-0 p-0'>
        <div className='space-y-2 border-b p-2.5'>
          <div className='relative'>
            <Search className='text-muted-foreground pointer-events-none absolute top-2.5 left-2.5 h-4 w-4' />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('Search models')}
              aria-label={t('Search models')}
              className='pl-8'
            />
          </div>
          <div className='flex items-center justify-between'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={toggleVisible}
              disabled={visibleOptions.length === 0}
            >
              {allVisibleSelected ? t('Clear') : t('All')}
            </Button>
            <span className='text-muted-foreground text-xs tabular-nums'>
              {props.selected.length}/{props.options.length}
            </span>
          </div>
        </div>
        <ScrollArea className='h-64'>
          {visibleOptions.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center text-sm'>
              {t('No data available')}
            </div>
          ) : (
            <div className='grid gap-0.5 p-2'>
              {visibleOptions.map((name, index) => {
                const checkboxId = `${baseId}-model-${index}`
                return (
                  <div
                    key={name}
                    className='hover:bg-accent flex items-center gap-2 rounded-md px-1.5 py-1'
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={selectedSet.has(name)}
                      onCheckedChange={(checked) =>
                        toggleModel(name, checked === true)
                      }
                    />
                    <Label
                      htmlFor={checkboxId}
                      title={name}
                      className='min-w-0 flex-1 cursor-pointer truncate text-xs font-normal'
                    >
                      {name}
                    </Label>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
