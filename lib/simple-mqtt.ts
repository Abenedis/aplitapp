// Simple MQTT client for aplit.tech broker
export class SimpleMQTTClient {
  private ws: WebSocket | null = null
  private isConnected = false
  private subscriptions = new Map<string, (data: any) => void>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectInterval = 3000

  constructor() {
    this.connect()
  }

  private connect() {
    try {
      // Try WebSocket connection to MQTT broker
      this.ws = new WebSocket('ws://aplit.tech:8083/mqtt')
      
      this.ws.onopen = () => {
        console.log('✅ MQTT WebSocket connected to aplit.tech')
        this.isConnected = true
        this.reconnectAttempts = 0
        
        // Subscribe to sensor topics immediately
        this.subscribeToSensorTopics()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📡 Received MQTT data:', data)
          
          // Handle different message formats
          if (data.topic && data.payload) {
            this.handleSensorData(data.topic, data.payload)
          } else if (data.macAddress) {
            // Direct sensor data
            this.handleSensorData('sensors', data)
          }
        } catch (error) {
          console.log('📡 Received raw MQTT data:', event.data)
          // Try to parse as sensor data
          try {
            const sensorData = JSON.parse(event.data)
            if (sensorData.macAddress) {
              this.handleSensorData('sensors', sensorData)
            }
          } catch (parseError) {
            console.warn('Could not parse MQTT message:', event.data)
          }
        }
      }

      this.ws.onclose = (event) => {
        console.log('❌ MQTT WebSocket disconnected:', event.code, event.reason)
        this.isConnected = false
        this.handleReconnect()
      }

      this.ws.onerror = (error) => {
        console.warn('⚠️ MQTT WebSocket error:', error)
        this.isConnected = false
        this.handleReconnect()
      }
    } catch (error) {
      console.error('Failed to create MQTT connection:', error)
      this.handleReconnect()
    }
  }

  private subscribeToSensorTopics() {
    if (!this.ws || !this.isConnected) return

    const topics = [
      'shibaSensors/#',
      'sensors/#',
      'device/#',
      'aplit/#',
      'temperature/#',
      'humidity/#'
    ]

    topics.forEach(topic => {
      const subscribeMessage = {
        type: 'subscribe',
        topic: topic,
        qos: 0
      }
      
      console.log(`📡 Subscribing to topic: ${topic}`)
      this.ws?.send(JSON.stringify(subscribeMessage))
    })
  }

  private handleSensorData(topic: string, payload: any) {
    try {
      let sensorData: any
      
      if (typeof payload === 'string') {
        sensorData = JSON.parse(payload)
      } else {
        sensorData = payload
      }

      // Validate sensor data
      if (!sensorData.macAddress && !sensorData.device) {
        console.warn('Invalid sensor data - no MAC address:', sensorData)
        return
      }

      const macAddress = sensorData.macAddress || sensorData.device
      
      // Find callback for this topic pattern
      for (const [subscribedTopic, callback] of this.subscriptions) {
        if (this.topicMatches(subscribedTopic, topic)) {
          callback({
            macAddress,
            temp: sensorData.temp || sensorData.temperature || 0,
            humid: sensorData.humid || sensorData.humidity || 0,
            ac_current: sensorData.ac_current || 0,
            opt_sensor: sensorData.opt_sensor || 0,
            hull: sensorData.hull || 0,
            pir: sensorData.pir || 0,
            in2: sensorData.in2 || 0,
            dist: sensorData.dist || sensorData.distance || 0,
            timestamp: sensorData.timestamp || new Date().toISOString()
          })
          break
        }
      }
    } catch (error) {
      console.error('Error handling sensor data:', error)
    }
  }

  private topicMatches(pattern: string, topic: string): boolean {
    if (pattern === topic) return true
    if (pattern.endsWith('#') && topic.startsWith(pattern.slice(0, -1))) return true
    if (pattern.includes('+') && this.wildcardMatch(pattern, topic)) return true
    return false
  }

  private wildcardMatch(pattern: string, topic: string): boolean {
    const patternParts = pattern.split('/')
    const topicParts = topic.split('/')
    
    if (patternParts.length !== topicParts.length) return false
    
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] !== '+' && patternParts[i] !== topicParts[i]) {
        return false
      }
    }
    
    return true
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached. Running in mock mode.')
      return
    }

    this.reconnectAttempts++
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

    setTimeout(() => {
      this.connect()
    }, this.reconnectInterval)
  }

  public subscribe(topic: string, callback: (data: any) => void) {
    this.subscriptions.set(topic, callback)
    
    if (this.isConnected && this.ws) {
      const subscribeMessage = {
        type: 'subscribe',
        topic: topic,
        qos: 0
      }
      
      this.ws.send(JSON.stringify(subscribeMessage))
    }
  }

  public unsubscribe(topic: string) {
    this.subscriptions.delete(topic)
    
    if (this.isConnected && this.ws) {
      const unsubscribeMessage = {
        type: 'unsubscribe',
        topic: topic
      }
      
      this.ws.send(JSON.stringify(unsubscribeMessage))
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    this.subscriptions.clear()
  }

  public getConnectionStatus() {
    return this.isConnected
  }

  public reconnect() {
    console.log('🔄 Manual reconnect requested')
    this.disconnect()
    this.reconnectAttempts = 0
    setTimeout(() => {
      this.connect()
    }, 1000)
  }
}

// Export singleton instance
export const mqttClient = new SimpleMQTTClient()
