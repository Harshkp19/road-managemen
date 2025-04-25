"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface TrafficChartProps {
  data: any[]
}

export function TrafficChart({ data }: TrafficChartProps) {
  return (
    <ChartContainer
      config={{
        traffic: {
          label: "Traffic Count",
          color: "hsl(var(--chart-1))",
        },
        average: {
          label: "Average",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`
            }}
          />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Line type="monotone" dataKey="traffic" stroke="var(--color-traffic)" name="Traffic Count" strokeWidth={2} />
          <Line
            type="monotone"
            dataKey="average"
            stroke="var(--color-average)"
            name="Average"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
