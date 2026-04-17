'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { useMemo } from 'react'
import { type StateSnapshot } from '@/lib/history-store'

const stateMap: Record<string, number> = {
  'IDLE': 1,
  'READY': 2,
  'STARTING': 3,
  'RUNNING': 4,
  'PAUSED': 5,
  'COMPLETE': 6,
  'ABORTING': 7,
  'ABORTED': 8,
  'ERROR': 9,
  'FAILED': 10,
}

export default function HistoryChartInner({ snapshots }: { snapshots: StateSnapshot[] }) {
  const chartData = useMemo(() => {
    return snapshots.map((s) => ({
      time: s.timestamp ? new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      alarms: s.alarmCount ?? 0,
      runs: s.numRuns ?? 0,
      stateNum: stateMap[s.overallState?.toUpperCase()] ?? 0,
    }))
  }, [snapshots])

  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 10 }}>
          <XAxis
            dataKey="time"
            tickLine={false}
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
            label={{ value: 'Time', position: 'insideBottom', offset: -15, style: { textAnchor: 'middle', fontSize: 11 } }}
          />
          <YAxis
            tickLine={false}
            tick={{ fontSize: 10 }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
          />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="alarms" stroke="#FF6363" strokeWidth={2} dot={false} name="Alarms" />
          <Line type="monotone" dataKey="runs" stroke="#60B5FF" strokeWidth={2} dot={false} name="Active Runs" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
