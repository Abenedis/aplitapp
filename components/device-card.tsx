import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { DeviceData } from "@/lib/types"

interface DeviceCardProps {
  device: DeviceData
}

export function DeviceCard({ device }: DeviceCardProps) {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const sensorData = [
    { label: "Temperature", value: `${device.temp.toFixed(2)}°C`, key: "temp" },
    { label: "Humidity", value: `${device.humid.toFixed(2)}%`, key: "humid" },
    { label: "AC Current", value: device.ac_current.toString(), key: "ac_current" },
    { label: "Optical Sensor", value: device.opt_sensor.toString(), key: "opt_sensor" },
    { label: "Magnetometer (HULL)", value: device.hull.toString(), key: "hull" },
    {
      label: "PIR Sensor",
      value: device.pir === 1 ? "Active" : "Inactive",
      key: "pir",
      highlight: device.pir === 1,
    },
    { label: "GPIO7 (IN2)", value: device.in2.toString(), key: "in2" },
    { label: "Distance", value: `${device.dist} cm`, key: "dist" },
  ]

  return (
    <Card className="border-border bg-card">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <code className="font-mono text-sm font-medium text-foreground">{device.device}</code>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-sm font-medium text-success">Online</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {sensorData.map((sensor) => (
            <div
              key={sensor.key}
              className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
            >
              <span className="text-sm text-muted-foreground">{sensor.label}</span>
              <span
                className={`font-mono text-sm font-medium ${sensor.highlight ? "text-success" : "text-foreground"}`}
              >
                {sensor.value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Last Updated</span>
            <span className="font-mono text-xs text-muted-foreground">{formatTimestamp(device.timestamp)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
