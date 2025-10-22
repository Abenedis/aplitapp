// Real MQTT client for aplit.tech:1883
export class RealMQTTClient {
  private ws: WebSocket | null = null
  private isConnected = false
  private subscriptions = new Map<string, (data: any) => void>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectInterval = 3000
  private messageId = 1

  constructor() {
    this.connect()
  }

  private connect() {
    try {
      // Try to connect to MQTT broker via WebSocket bridge
      // Many MQTT brokers provide WebSocket support on port 8083 or 9001
      const endpoints = [
        'ws://aplit.tech:8083/mqtt',  // Standard MQTT over WebSocket
        'ws://aplit.tech:9001',       // Alternative WebSocket port
        'ws://aplit.tech:8080/mqtt',  // Another common port
        'ws://aplit.tech:15675/ws'    // RabbitMQ WebSocket (if available)
      ]

      let connected = false
      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying to connect to MQTT broker via: ${endpoint}`)
          this.ws = new WebSocket(endpoint)
          this.setupWebSocket()
          connected = true
          break
        } catch (error) {
          console.log(`❌ Failed to connect to ${endpoint}:`, error)
          continue
        }
      }
      
      if (!connected) {
        console.warn('⚠️ All MQTT WebSocket endpoints failed. MQTT broker may not support WebSocket.')
        console.log('💡 To connect to aplit.tech:1883, you need a WebSocket bridge server.')
        this.isConnected = false
      }
    } catch (error) {
      console.error('Failed to create MQTT connection:', error)
      this.isConnected = false
    }
  }

  private setupWebSocket() {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected to MQTT broker')
      this.isConnected = true
      this.reconnectAttempts = 0
      
      // Send MQTT CONNECT message
      this.sendMQTTConnect()
    }

    this.ws.onmessage = (event) => {
      try {
        this.handleMQTTMessage(event.data)
      } catch (error) {
        console.error('Error handling MQTT message:', error)
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
  }

  private sendMQTTConnect() {
    if (!this.ws || !this.isConnected) return

    // MQTT CONNECT message for aplit.tech:1883
    const connectMessage = {
      type: 'connect',
      clientId: `web_client_${Date.now()}`,
      username: 'test',
      password: 'test',
      keepAlive: 60,
      cleanSession: true,
      protocolVersion: 4, // MQTT 3.1.1
      host: 'aplit.tech',
      port: 1883
    }

    console.log('📡 Sending MQTT CONNECT message to aplit.tech:1883')
    this.ws.send(JSON.stringify(connectMessage))
  }

  private handleMQTTMessage(data: string) {
    try {
      const message = JSON.parse(data)
      console.log('📡 Received MQTT message:', message)
      
      switch (message.type) {
        case 'connack':
          console.log('✅ MQTT connection to aplit.tech:1883 acknowledged')
          this.subscribeToSensorTopics()
          break
          
        case 'publish':
          this.handlePublish(message)
          break
          
        case 'suback':
          console.log('✅ MQTT subscription acknowledged:', message.topic)
          break
          
        default:
          console.log('📡 Unknown MQTT message type:', message.type)
      }
    } catch (error) {
      // Try to handle as raw sensor data
      try {
        const sensorData = JSON.parse(data)
        if (sensorData.macAddress || sensorData.device) {
          console.log('📡 Received sensor data from aplit.tech:', sensorData)
          this.handleSensorData('sensors', sensorData)
        }
      } catch (parseError) {
        console.log('📡 Received raw data from aplit.tech:', data)
      }
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

    console.log('📡 Subscribing to sensor topics on aplit.tech:1883')
    topics.forEach(topic => {
      this.subscribe(topic)
    })
  }

  private handlePublish(message: any) {
    const topic = message.topic
    const payload = message.payload

    console.log(`📡 Received MQTT publish on topic ${topic}:`, payload)

    // Find callback for this topic
    for (const [subscribedTopic, callback] of this.subscriptions) {
      if (this.topicMatches(subscribedTopic, topic)) {
        try {
          const data = typeof payload === 'string' ? JSON.parse(payload) : payload
          callback(data)
        } catch (error) {
          callback(payload)
        }
        break
      }
    }
  }

  private handleSensorData(topic: string, data: any) {
    // Find callback for this topic
    for (const [subscribedTopic, callback] of this.subscriptions) {
      if (this.topicMatches(subscribedTopic, topic)) {
        callback(data)
        break
      }
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
      console.error('❌ Max reconnection attempts reached. MQTT broker aplit.tech:1883 is not accessible via WebSocket.')
      console.log('💡 You need a WebSocket bridge server to connect to MQTT broker from browser.')
      return
    }

    this.reconnectAttempts++
    console.log(`🔄 Attempting to reconnect to aplit.tech:1883 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

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
        qos: 0,
        messageId: this.messageId++
      }
      
      console.log(`📡 Subscribing to MQTT topic: ${topic}`)
      this.ws.send(JSON.stringify(subscribeMessage))
    }
  }

  public unsubscribe(topic: string) {
    this.subscriptions.delete(topic)
    
    if (this.isConnected && this.ws) {
      const unsubscribeMessage = {
        type: 'unsubscribe',
        topic: topic,
        messageId: this.messageId++
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
    console.log('🔄 Manual reconnect to aplit.tech:1883 requested')
    this.disconnect()
    this.reconnectAttempts = 0
    setTimeout(() => {
      this.connect()
    }, 1000)
  }
}

// Export singleton instance
export const realMQTTClient = new RealMQTTClient()
