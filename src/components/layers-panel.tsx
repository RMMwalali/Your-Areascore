'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Layers, X, GraduationCap, Stethoscope, ShoppingCart, Bus, Route, Info } from 'lucide-react'

export type LayerKey =
  | 'schools'
  | 'health'
  | 'shopping'
  | 'transport'
  | 'roads'

export interface LayersState {
  schools: boolean
  health: boolean
  shopping: boolean
  transport: boolean
  roads: boolean
}

interface LayersPanelProps {
  value: LayersState
  onChange: (next: LayersState) => void
  isMobile?: boolean
  isOpen?: boolean
  onClose?: () => void
}

const DEFAULT_LABELS: Record<LayerKey, string> = {
  schools: 'Schools',
  health: 'Healthcare',
  shopping: 'Markets & Shops',
  transport: 'Transport',
  roads: 'Road Access'
}

const DEFAULT_ICONS: Record<LayerKey, React.ComponentType<{ className?: string }>> = {
  schools: GraduationCap,
  health: Stethoscope,
  shopping: ShoppingCart,
  transport: Bus,
  roads: Route
}

export function LayersPanel({ value, onChange, isMobile = false, isOpen = true, onClose }: LayersPanelProps) {
  const toggle = (key: LayerKey) => {
    onChange({ ...value, [key]: !value[key] })
  }

  const content = (
    <Card className={isMobile ? 'border-0 rounded-t-2xl shadow-none' : 'border-primary-100 shadow-lg'}>
      <CardHeader className={isMobile ? 'pb-3' : 'pb-3'}>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-primary-600" />
            Layers & Filters
          </CardTitle>
          {isMobile && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-primary-100 bg-primary-50/40 p-3 text-xs text-gray-700">
          Toggle what you want to visualize. Click on the map to generate a detailed area profile.
        </div>

        <div className="space-y-2">
          {(Object.keys(DEFAULT_LABELS) as LayerKey[]).map((key) => {
            const Icon = DEFAULT_ICONS[key]
            const enabled = value[key]
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition-colors flex items-center justify-between gap-3 ${
                  enabled
                    ? 'border-primary-200 bg-white'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${enabled ? 'bg-primary-100' : 'bg-gray-100'}`}>
                    <Icon className={`h-4 w-4 ${enabled ? 'text-primary-700' : 'text-gray-600'}`} />
                  </span>
                  <span className="text-sm font-medium truncate">{DEFAULT_LABELS[key]}</span>
                </span>
                <Badge
                  variant={enabled ? 'default' : 'secondary'}
                  className={enabled ? '' : 'bg-gray-100 text-gray-700'}
                >
                  {enabled ? 'On' : 'Off'}
                </Badge>
              </button>
            )
          })}
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <Info className="h-4 w-4 text-primary-600 mt-0.5" />
            <p>
              Data sources include OpenStreetMap (via Overpass). Coverage varies by region.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (isMobile) {
    if (!isOpen) return null
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl border-t">
          {content}
        </div>
      </div>
    )
  }

  return isOpen ? content : null
}
