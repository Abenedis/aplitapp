"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { DeviceData } from "@/lib/types"

// Utility functions for time conversion
const convertTo12Hour = (time24: string): { time: string; period: string } => {
  if (!time24) return { time: '', period: 'AM' }
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return {
    time: `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
    period
  }
}

const convertTo24Hour = (time12: string, period: string): string => {
  if (!time12) return ''
  const [hours, minutes] = time12.split(':').map(Number)
  let hours24 = hours
  if (period === 'AM' && hours === 12) hours24 = 0
  if (period === 'PM' && hours !== 12) hours24 = hours + 12
  return `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// Time picker component with AM/PM
interface TimePickerProps {
  id: string
  value: string
  onChange: (value: string) => void
  className?: string
}

function TimePicker({ id, value, onChange, className }: TimePickerProps) {
  const { time, period } = convertTo12Hour(value)
  
  const handleTimeChange = (newTime: string) => {
    const time24 = convertTo24Hour(newTime, period)
    onChange(time24)
  }
  
  const handlePeriodChange = (newPeriod: string) => {
    const time24 = convertTo24Hour(time, newPeriod)
    onChange(time24)
  }

  return (
    <div className="flex gap-2">
      <Input
        id={id}
        type="time"
        value={time}
        onChange={(e) => handleTimeChange(e.target.value)}
        className={`bg-secondary ${className}`}
      />
      <Select value={period} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-20 bg-secondary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

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
              <TimePicker
                id="time-from"
                value={timeFrom}
                onChange={onTimeFromChange}
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
              <TimePicker
                id="time-to"
                value={timeTo}
                onChange={onTimeToChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
