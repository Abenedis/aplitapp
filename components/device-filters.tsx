"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { DeviceData } from "@/lib/types"

interface DeviceFiltersProps {
  selectedDevice: string
  onDeviceChange: (value: string) => void
  dateFrom: string
  onDateFromChange: (value: string) => void
  dateTo: string
  onDateToChange: (value: string) => void
  devices: DeviceData[]
}

export function DeviceFilters({
  selectedDevice,
  onDeviceChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  devices,
}: DeviceFiltersProps) {
  const uniqueDevices = Array.from(new Set(devices.map((d) => d.device)))

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="device-select" className="text-sm font-medium text-foreground">
            Device MAC Address
          </Label>
          <Select value={selectedDevice} onValueChange={onDeviceChange}>
            <SelectTrigger id="device-select" className="bg-secondary">
              <SelectValue placeholder="Select device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              {uniqueDevices.map((device) => (
                <SelectItem key={device} value={device}>
                  {device}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-from" className="text-sm font-medium text-foreground">
            Date From
          </Label>
          <Input
            id="date-from"
            type="datetime-local"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="bg-secondary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-to" className="text-sm font-medium text-foreground">
            Date To
          </Label>
          <Input
            id="date-to"
            type="datetime-local"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="bg-secondary"
          />
        </div>
      </div>
    </div>
  )
}
