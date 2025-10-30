export interface SensorReading {
  temp: number
  humid: number
  ac_current: number
  opt_sensor: number
  hull: number
  pir: number
  in2: number
  dist: number
  timestamp: string
  // Raw payload from the broker to display all fields coming from devices
  payload?: Record<string, unknown>
}

export interface Device {
  macAddress: string
  readings: SensorReading[]
  status?: 'active' | 'hidden' | 'deleted'
}

export interface DeviceName {
  homeName: string
  roomName: string
}

// Legacy interface for backward compatibility
export interface DeviceData {
  device: string
  temp: number
  humid: number
  ac_current: number
  opt_sensor: number
  hull: number
  pir: number
  in2: number
  dist: number
  timestamp: string
}
