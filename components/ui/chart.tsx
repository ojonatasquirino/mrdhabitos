"use client"

// Componente Chart no padrão shadcn/ui (wrapper sobre Recharts)
import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

export type ChartConfig = Record<string, { label?: React.ReactNode; color?: string }>

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) throw new Error("useChart precisa estar dentro de <ChartContainer>")
  return ctx
}

export function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
}) {
  const uid = React.useId()
  const chartId = `chart-${id ?? uid.replace(/:/g, "")}`
  const vars = Object.entries(config)
    .filter(([, c]) => c.color)
    .map(([k, c]) => `--color-${k}: ${c.color};`)
    .join(" ")

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs",
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
          "[&_.recharts-cartesian-grid_line]:stroke-border/60",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border",
          "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-foreground/[0.04]",
          "[&_.recharts-layer]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <style dangerouslySetInnerHTML={{ __html: `[data-chart=${chartId}] { ${vars} }` }} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

export const ChartTooltip = RechartsPrimitive.Tooltip

interface TooltipItem {
  dataKey?: string | number
  name?: string | number
  value?: number | string
  color?: string
  payload?: Record<string, unknown>
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelKey,
  formatter,
}: {
  active?: boolean
  payload?: TooltipItem[]
  label?: React.ReactNode
  labelKey?: string
  formatter?: (value: number | string, item: TooltipItem) => React.ReactNode
}) {
  const { config } = useChart()
  if (!active || !payload?.length) return null
  const title = labelKey ? (payload[0]?.payload?.[labelKey] as React.ReactNode) : label

  return (
    <div className="min-w-32 rounded-xl border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {title != null && <div className="mb-1 font-medium text-foreground">{title}</div>}
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.name)
        return (
          <div key={key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: item.color ?? `var(--color-${key})` }}
            />
            <span className="text-muted-foreground">{config[key]?.label ?? key}</span>
            <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
              {formatter ? formatter(item.value ?? 0, item) : item.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}
