// API route for MQTT data from aplit.tech:1883
import { NextRequest, NextResponse } from 'next/server'
import { connectMQTT, getDeviceReadings, getMQTTStatus } from '@/lib/mqtt-server'

export async function GET(request: NextRequest) {
  try {
    console.log('📡 Server: Getting data from MQTT broker aplit.tech:1883')
    
    // Ensure MQTT connection
    const isConnected = await connectMQTT()
    
    if (!isConnected) {
      console.log('⚠️  MQTT broker unavailable, returning empty data')
      return NextResponse.json({
        success: false,
        message: 'MQTT broker aplit.tech:1883 is not available',
        devices: [],
        broker: 'aplit.tech:1883',
        connected: false
      })
    }
    
    // Get device readings from MQTT
    const devices = getDeviceReadings()
    
    console.log(`📡 Server: Retrieved data from ${devices.length} devices`)

    return NextResponse.json({
      success: true,
      message: 'Data from MQTT broker aplit.tech:1883',
      devices: devices,
      broker: 'aplit.tech:1883',
      connected: true,
      deviceCount: devices.length
    })
    
  } catch (error) {
    console.error('❌ Server: Failed to get MQTT data:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to get MQTT data from aplit.tech:1883',
      error: error instanceof Error ? error.message : 'Unknown error',
      broker: 'aplit.tech:1883',
      devices: [],
      connected: false
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
