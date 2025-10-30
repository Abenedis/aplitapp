// MQTT client for server-side connection to aplit.tech:1883
// @ts-ignore - mqtt package types
import mqtt from 'mqtt'
import type { SensorReading } from './types'

interface DeviceData {
  macAddress: string
  readings: SensorReading[]
}

// Store device readings (in production, this would be in a database)
let deviceReadings: { [macAddress: string]: SensorReading[] } = {}
let mqttClient: mqtt.MqttClient | null = null
let isConnected = false
// Allow disabling server-side MQTT (e.g., on Vercel/serverless)
const DISABLE_SERVER_MQTT =
  process.env.DISABLE_SERVER_MQTT === 'true' ||
  process.env.NEXT_PUBLIC_DISABLE_SERVER_MQTT === 'true' ||
  process.env.VERCEL === '1'

// Subscribe to topics and store data
const subscribeToTopics = (client: mqtt.MqttClient) => {
  const topics = [
    'shibaSensors',          // Прямая подписка на основной топик (без подуровней)
    'shibaSensors/#',        // Подписка на все подтопики
    'sensors/#',             // Резервный топик для общих сенсоров
    'device/#'               // Резервный топик для устройств
  ]

  console.log('📡 Subscribing to MQTT topics on aplit.tech:1883...')
  
  // Remove any existing message listener to avoid duplicates
  client.removeAllListeners('message')
  
  // Handle incoming messages
  client.on('message', (topic, message) => {
    try {
      console.log(`📨 [MQTT] Received message from topic: ${topic}`)
      console.log(`📨 [MQTT] Message length: ${message.length} bytes`)
      console.log(`📨 [MQTT] Message content: ${message.toString()}`)
      
      const messageStr = message.toString()
      let data: any = {}
      
      try {
        data = JSON.parse(messageStr)
        console.log(`📨 Parsed data:`, JSON.stringify(data, null, 2))
      } catch (parseError) {
        console.warn('⚠️  Message is not valid JSON, treating as raw string')
        data = { raw: messageStr }
      }
      
      // Extract MAC address from topic or data (priority: device > macAddress > mac_address)
      let macAddress = data.device || data.macAddress || data.mac_address
      
      // Try to extract MAC from topic path
      if (!macAddress && topic.includes('/')) {
        const topicParts = topic.split('/')
        // Try last part of topic as MAC address
        const possibleMac = topicParts[topicParts.length - 1]
        // Support different MAC formats: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
        if (possibleMac && (
          possibleMac.match(/^[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:/) || 
          possibleMac.match(/^[0-9A-Fa-f]{2}-[0-9A-Fa-f]{2}-/)
        )) {
          macAddress = possibleMac.toUpperCase()
        }
      }
      
      // Normalize MAC address format (convert to uppercase and standardize separator)
      if (macAddress) {
        // Convert to string and uppercase
        macAddress = String(macAddress).toUpperCase()
        // Normalize separators: replace dashes with colons
        macAddress = macAddress.replace(/-/g, ':')
        // Remove any whitespace
        macAddress = macAddress.trim()
      }
      
      if (!macAddress) {
        console.warn('⚠️  No MAC address found in message. Topic:', topic, 'Data:', data)
        // Still store the data with topic as identifier
        macAddress = `unknown_${topic.replace(/\//g, '_')}_${Date.now()}`
      }

      // Create sensor reading
      const reading: SensorReading = {
        temp: data.temp || data.temperature || 0,
        humid: data.humid || data.humidity || 0,
        ac_current: data.ac_current || 0,
        opt_sensor: data.opt_sensor || 0,
        hull: data.hull || 0,
        pir: data.pir || 0,
        in2: data.in2 || 0,
        dist: data.dist || data.distance || 0,
        timestamp: data.timestamp || new Date().toISOString()
      }

      // Add to device readings (keep max 10 readings)
      if (!deviceReadings[macAddress]) {
        deviceReadings[macAddress] = []
      }
      
      deviceReadings[macAddress].push(reading)
      
      // Keep only last 10 readings
      if (deviceReadings[macAddress].length > 10) {
        deviceReadings[macAddress] = deviceReadings[macAddress].slice(-10)
      }

      console.log(`📡 Updated reading for device ${macAddress}: temp=${reading.temp.toFixed(1)}°C, humid=${reading.humid.toFixed(1)}%`)
    } catch (error) {
      console.error('❌ Error processing MQTT message:', error)
    }
  })
  
  // Subscribe to topics
  topics.forEach(topic => {
    client.subscribe(topic, { qos: 0 }, (err) => {
      if (err) {
        console.error(`❌ Failed to subscribe to ${topic}:`, err)
      } else {
        console.log(`✅ Subscribed to ${topic}`)
      }
    })
  })
}

// Connect to MQTT broker
export const connectMQTT = async (): Promise<boolean> => {
  if ( DISABLE_SERVER_MQTT ) {
    if (!isConnected) {
      console.log('⚙️  Server-side MQTT is disabled by environment. Skipping connection.')
    }
    return false
  }
  return new Promise((resolve) => {
    if (mqttClient && isConnected) {
      console.log('✅ MQTT client already connected to aplit.tech:1883')
      resolve(true)
      return
    }

    console.log('📡 Connecting to MQTT broker aplit.tech:1883...')
    
    try {
      const client = mqtt.connect('mqtt://aplit.tech:1883', {
        clientId: `aplit_server_${Date.now()}`,
        username: 'test',
        password: 'test',
        reconnectPeriod: 5000,
        connectTimeout: 10000,
        protocolVersion: 4, // MQTT 3.1.1
        clean: true
      })

      client.on('connect', () => {
        console.log('✅ Connected to MQTT broker aplit.tech:1883')
        isConnected = true
        mqttClient = client
        
        // Subscribe to topics
        subscribeToTopics(client)
        
        // Log when ready to receive messages
        console.log('📡 MQTT client ready to receive messages')
        
        resolve(true)
      })

      client.on('error', (error) => {
        console.error('❌ MQTT connection error:', error)
        isConnected = false
        resolve(false)
      })

      client.on('offline', () => {
        console.log('❌ MQTT client went offline')
        isConnected = false
      })

      client.on('close', () => {
        console.log('❌ MQTT connection closed')
        isConnected = false
        mqttClient = null
      })

      client.on('packetsend', (packet) => {
        console.log('📤 [MQTT] Packet sent:', packet.cmd)
      })

      client.on('packetreceive', (packet) => {
        console.log('📥 [MQTT] Packet received:', packet.cmd)
        if (packet.cmd === 'publish') {
          console.log('📥 [MQTT] Publish packet - Topic:', packet.topic, 'QoS:', packet.qos)
        }
      })

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!isConnected) {
          console.log('⏱️  MQTT connection timeout')
          resolve(false)
        }
      }, 10000)
    } catch (error) {
      console.error('❌ Failed to create MQTT client:', error)
      resolve(false)
    }
  })
}

// Get all device readings
export const getDeviceReadings = (): DeviceData[] => {
  return Object.keys(deviceReadings).map(macAddress => ({
    macAddress,
    readings: deviceReadings[macAddress]
  }))
}

// Get connection status
export const getMQTTStatus = (): boolean => {
  return isConnected
}

// Disconnect from MQTT broker
export const disconnectMQTT = () => {
  if (mqttClient) {
    mqttClient.end()
    mqttClient = null
    isConnected = false
    console.log('✅ Disconnected from MQTT broker')
  }
}

// Initialize connection on module load only in Node.js environment, and when enabled
if (typeof window === 'undefined' && !DISABLE_SERVER_MQTT) {
  connectMQTT().then(connected => {
    if (connected) {
      console.log('✅ MQTT client initialized successfully')
    } else {
      console.log('⚠️  MQTT client could not connect, will retry on first API call')
    }
  })
} else if (typeof window === 'undefined' && DISABLE_SERVER_MQTT) {
  console.log('⚙️  Skipping server-side MQTT initialization (disabled).')
}

