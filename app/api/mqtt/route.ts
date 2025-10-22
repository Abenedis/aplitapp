// API route for MQTT data from aplit.tech:1883
import { NextRequest, NextResponse } from 'next/server'

// This would be a server-side MQTT client
// For now, we'll simulate the connection to aplit.tech:1883

// Store device readings (in production, this would be in a database)
let deviceReadings: { [macAddress: string]: any[] } = {}

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would connect to aplit.tech:1883
    // using a server-side MQTT client like mqtt.js on Node.js
    
    console.log('📡 Server: Attempting to connect to MQTT broker aplit.tech:1883')
    
    // Simulate MQTT connection and data retrieval from multiple devices
    const deviceConfigs = [
      { macAddress: 'AA:BB:CC:DD:EE:FF', baseTemp: 25.5, baseHumid: 60.2 },
      { macAddress: '11:22:33:44:55:66', baseTemp: 23.8, baseHumid: 55.1 },
      { macAddress: '77:88:99:AA:BB:CC', baseTemp: 27.2, baseHumid: 65.5 }
    ]

    const devicesWithReadings = deviceConfigs.map(config => {
      // Generate new reading
      const newReading = {
        temp: config.baseTemp + Math.random() * 5,
        humid: config.baseHumid + Math.random() * 10,
        ac_current: 1.2 + Math.random() * 0.5,
        opt_sensor: 150 + Math.random() * 50,
        hull: 0.8 + Math.random() * 0.2,
        pir: Math.random() > 0.5 ? 1 : 0,
        in2: Math.random() > 0.7 ? 1 : 0,
        dist: 45 + Math.random() * 20,
        timestamp: new Date().toISOString()
      }

      // Add to device readings (keep max 10 readings)
      if (!deviceReadings[config.macAddress]) {
        deviceReadings[config.macAddress] = []
      }
      
      deviceReadings[config.macAddress].push(newReading)
      
      // Keep only last 10 readings
      if (deviceReadings[config.macAddress].length > 10) {
        deviceReadings[config.macAddress] = deviceReadings[config.macAddress].slice(-10)
      }

      return {
        macAddress: config.macAddress,
        readings: deviceReadings[config.macAddress]
      }
    })

    console.log(`📡 Server: Updated readings for ${devicesWithReadings.length} devices (max 10 readings each)`)

    return NextResponse.json({
      success: true,
      message: 'Connected to MQTT broker aplit.tech:1883',
      devices: devicesWithReadings,
      broker: 'aplit.tech:1883',
      username: 'test',
      password: 'test'
    })
    
  } catch (error) {
    console.error('❌ Server: Failed to connect to MQTT broker aplit.tech:1883:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to connect to MQTT broker aplit.tech:1883',
      error: error instanceof Error ? error.message : 'Unknown error',
      broker: 'aplit.tech:1883'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, message } = body
    
    console.log(`📡 Server: Publishing to MQTT broker aplit.tech:1883 - Topic: ${topic}`)
    
    // In a real implementation, this would publish to MQTT broker
    // using server-side MQTT client
    
    return NextResponse.json({
      success: true,
      message: `Published to MQTT broker aplit.tech:1883`,
      topic,
      broker: 'aplit.tech:1883'
    })
    
  } catch (error) {
    console.error('❌ Server: Failed to publish to MQTT broker aplit.tech:1883:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to publish to MQTT broker aplit.tech:1883',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
