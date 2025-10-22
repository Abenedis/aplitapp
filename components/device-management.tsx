"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff, Trash2, RotateCcw, X } from "lucide-react"
import type { Device, DeviceName } from "@/lib/types"

interface DeviceManagementProps {
  devices: Device[]
  deviceNames: Record<string, DeviceName>
  onDeviceAction: (macAddress: string, action: 'hide' | 'show' | 'delete' | 'restore') => void
}

export function DeviceManagement({ devices, deviceNames, onDeviceAction }: DeviceManagementProps) {
  const [activeTab, setActiveTab] = useState("active")

  const activeDevices = devices.filter(device => device.status !== 'hidden' && device.status !== 'deleted')
  const hiddenDevices = devices.filter(device => device.status === 'hidden')
  const deletedDevices = devices.filter(device => device.status === 'deleted')

  const getDeviceDisplayName = (device: Device) => {
    const deviceName = deviceNames[device.macAddress]
    return deviceName ? `${deviceName.homeName} - ${deviceName.roomName}` : device.macAddress
  }

  const DeviceCard = ({ device, showActions = true }: { device: Device; showActions?: boolean }) => (
    <Card className="p-4 border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/30 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {getDeviceDisplayName(device)}
          </div>
          <div className="font-mono text-xs text-gray-500 mt-1">
            {device.macAddress}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {device.readings.length} reading{device.readings.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center gap-2 ml-4">
            {device.status === 'active' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeviceAction(device.macAddress, 'hide')}
                  className="h-8 px-3 text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hide
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeviceAction(device.macAddress, 'delete')}
                  className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </>
            )}
            
            {device.status === 'hidden' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDeviceAction(device.macAddress, 'show')}
                className="h-8 px-3 text-green-600 border-green-200 hover:bg-green-50"
              >
                <Eye className="h-3 w-3 mr-1" />
                Show
              </Button>
            )}
            
            {device.status === 'deleted' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDeviceAction(device.macAddress, 'restore')}
                className="h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Restore
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-light tracking-tight text-gray-900">Device Management</h2>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            {activeDevices.length} Active
          </Badge>
          {hiddenDevices.length > 0 && (
            <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
              {hiddenDevices.length} Hidden
            </Badge>
          )}
          {deletedDevices.length > 0 && (
            <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
              {deletedDevices.length} Deleted
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Active ({activeDevices.length})
          </TabsTrigger>
          <TabsTrigger value="hidden" className="flex items-center gap-2">
            <EyeOff className="h-4 w-4" />
            Hidden ({hiddenDevices.length})
          </TabsTrigger>
          <TabsTrigger value="deleted" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Deleted ({deletedDevices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeDevices.length > 0 ? (
            <div className="grid gap-3">
              {activeDevices.map((device) => (
                <DeviceCard key={device.macAddress} device={device} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No active devices</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="hidden" className="space-y-4">
          {hiddenDevices.length > 0 ? (
            <div className="grid gap-3">
              {hiddenDevices.map((device) => (
                <DeviceCard key={device.macAddress} device={device} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <EyeOff className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hidden devices</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="deleted" className="space-y-4">
          {deletedDevices.length > 0 ? (
            <div className="grid gap-3">
              {deletedDevices.map((device) => (
                <DeviceCard key={device.macAddress} device={device} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No deleted devices</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
