"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { DeviceData, DeviceName } from "@/lib/types"

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

  // Generate hours (1-12) and minutes (00-59)
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
  
  const [selectedHour, selectedMinute] = time ? time.split(':') : ['12', '00']

  const handleHourChange = (hour: string) => {
    const newTime = `${hour.padStart(2, '0')}:${selectedMinute}`
    handleTimeChange(newTime)
  }

  const handleMinuteChange = (minute: string) => {
    const newTime = `${selectedHour}:${minute}`
    handleTimeChange(newTime)
  }

  return (
    <div className="flex gap-2">
      <div className="flex gap-1">
        <Select value={selectedHour} onValueChange={handleHourChange}>
          <SelectTrigger className="w-20 bg-secondary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hours.map(hour => (
              <SelectItem key={hour} value={hour}>
                {parseInt(hour)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <span className="flex items-center text-muted-foreground">:</span>
        
        <Select value={selectedMinute} onValueChange={handleMinuteChange}>
          <SelectTrigger className="w-20 bg-secondary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {minutes.map(minute => (
              <SelectItem key={minute} value={minute}>
                {minute}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
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
  onUpdateNames: () => void
  devices: DeviceData[]
  deviceNames: Record<string, DeviceName>
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
  onUpdateNames,
  devices,
  deviceNames,
}: DeviceFiltersProps) {
  const uniqueDevices = Array.from(new Set(devices.map((d) => d.device)))

  return (
    <div className="rounded-2xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/30 p-8 shadow-lg backdrop-blur-sm">
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-light tracking-tight text-gray-900">Filters</h3>
        <Button 
          onClick={onResetFilters} 
          variant="outline" 
          size="sm"
          className="h-9 px-4 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-none"
        >
          Reset Filters
        </Button>
      </div>
      <div className="mb-4">
        <Button 
          onClick={onUpdateNames} 
          variant="outline" 
          size="sm"
          className="h-9 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 hover:text-blue-800 shadow-sm hover:shadow-md transition-none"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Update Names
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="device-select" className="text-sm font-medium text-gray-700 tracking-wide">
            Device MAC Address
          </Label>
          <Select value={selectedDevice} onValueChange={onDeviceChange}>
            <SelectTrigger id="device-select" className="h-12 border-gray-200 bg-white/80 backdrop-blur-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <SelectValue placeholder="Select device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              {uniqueDevices.map((device) => {
                const deviceName = deviceNames[device]
                const displayName = deviceName 
                  ? `${deviceName.homeName} - ${deviceName.roomName}`
                  : device
                return (
                  <SelectItem key={device} value={device}>
                    {displayName}
                  </SelectItem>
                )
              })}
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
