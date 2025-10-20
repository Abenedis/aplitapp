"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Save, X } from "lucide-react"
import type { Device, DeviceName } from "@/lib/types"

interface UpdateNamesModalProps {
  isOpen: boolean
  onClose: () => void
  devices: Device[]
  deviceNames: Record<string, DeviceName>
  onSaveNames: (deviceNames: Record<string, DeviceName>) => void
}

export function UpdateNamesModal({ isOpen, onClose, devices, deviceNames, onSaveNames }: UpdateNamesModalProps) {
  const [selectedMacAddress, setSelectedMacAddress] = useState<string>("")
  const [homeName, setHomeName] = useState<string>("")
  const [roomName, setRoomName] = useState<string>("")

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedMacAddress("")
      setHomeName("")
      setRoomName("")
    }
  }, [isOpen])

  // Update form fields when device is selected
  useEffect(() => {
    if (selectedMacAddress && deviceNames[selectedMacAddress]) {
      const deviceName = deviceNames[selectedMacAddress]
      setHomeName(deviceName.homeName)
      setRoomName(deviceName.roomName)
    } else {
      setHomeName("")
      setRoomName("")
    }
  }, [selectedMacAddress, deviceNames])

  const handleSave = () => {
    if (!selectedMacAddress || !homeName.trim() || !roomName.trim()) {
      return
    }

    const deviceNames: Record<string, DeviceName> = {}
    deviceNames[selectedMacAddress] = {
      homeName: homeName.trim(),
      roomName: roomName.trim()
    }

    onSaveNames(deviceNames)
    onClose()
  }

  const handleCancel = () => {
    setSelectedMacAddress("")
    setHomeName("")
    setRoomName("")
    onClose()
  }

  const isFormValid = selectedMacAddress && homeName.trim() && roomName.trim()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
        <DialogHeader className="space-y-3 pb-6">
          <DialogTitle className="text-2xl font-light tracking-tight text-gray-900">
            Device Settings
          </DialogTitle>
          <p className="text-sm text-gray-500 font-light">
            Customize your device identification
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="device-select" className="text-sm font-medium text-gray-700 tracking-wide">
                Device
              </Label>
              <Select value={selectedMacAddress} onValueChange={setSelectedMacAddress}>
                <SelectTrigger className="h-12 border-gray-200 bg-white/80 backdrop-blur-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>
                <SelectContent className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                  {devices.map((device) => {
                    const deviceName = deviceNames[device.macAddress]
                    const displayName = deviceName 
                      ? `${deviceName.homeName} - ${deviceName.roomName}`
                      : device.macAddress
                    return (
                      <SelectItem key={device.macAddress} value={device.macAddress} className="hover:bg-gray-50">
                        <div className="flex flex-col">
                          <span className="font-medium">{displayName}</span>
                          <span className="font-mono text-xs text-gray-500">{device.macAddress}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="home-name" className="text-sm font-medium text-gray-700 tracking-wide">
                  Home Name
                </Label>
                <Input
                  id="home-name"
                  value={homeName}
                  onChange={(e) => setHomeName(e.target.value)}
                  placeholder=""
                  className="h-12 border-gray-200 bg-white/80 backdrop-blur-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="room-name" className="text-sm font-medium text-gray-700 tracking-wide">
                  Room Name
                </Label>
                <Input
                  id="room-name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder=""
                  className="h-12 border-gray-200 bg-white/80 backdrop-blur-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button 
              onClick={handleCancel} 
              variant="outline" 
              size="sm"
              className="h-10 px-6 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-none"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              size="sm" 
              disabled={!isFormValid}
              className="h-10 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-none"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
