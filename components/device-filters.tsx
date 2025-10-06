"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { DeviceData } from "@/lib/types"

interface DeviceFiltersProps {
  selectedDevice: string
  onDeviceChange: (value: string) => void
  dateFrom: string
  onDateFromChange: (value: string) => void
  dateTo: string
  onDateToChange: (value: string) => void
  timeFrom: string
  onTimeFromChange: (value: string) => void
  timeTo: string
  onTimeToChange: (value: string) => void
  onResetFilters: () => void
  devices: DeviceData[]
}

export function DeviceFilters({
  selectedDevice,
  onDeviceChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  timeFrom,
  onTimeFromChange,
  timeTo,
  onTimeToChange,
  onResetFilters,
  devices,
}: DeviceFiltersProps) {
  const uniqueDevices = Array.from(new Set(devices.map((d) => d.device)))

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button onClick={onResetFilters} variant="outline" size="sm">
          Reset Filters
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
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

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from" className="text-sm font-medium text-foreground">
                Date From
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="bg-secondary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-from" className="text-sm font-medium text-foreground">
                Time From
              </Label>
              <Input
                id="time-from"
                type="time"
                value={timeFrom}
                onChange={(e) => onTimeFromChange(e.target.value)}
                className="bg-secondary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-to" className="text-sm font-medium text-foreground">
                Date To
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className="bg-secondary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-to" className="text-sm font-medium text-foreground">
                Time To
              </Label>
              <Input
                id="time-to"
                type="time"
                value={timeTo}
                onChange={(e) => onTimeToChange(e.target.value)}
                className="bg-secondary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
