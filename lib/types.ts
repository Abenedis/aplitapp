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
}

export interface Device {
  macAddress: string
  readings: SensorReading[]
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
