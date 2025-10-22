// Native MQTT client for aplit.tech broker using WebSocket bridge
export class NativeMQTTClient {
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
      // Try different WebSocket endpoints that might bridge to MQTT
      const endpoints = [
        'ws://aplit.tech:9001', // Common MQTT over WebSocket port
        'ws://aplit.tech:8080/mqtt', // Alternative WebSocket bridge
        'ws://aplit.tech:8083/mqtt', // Original attempt
        'ws://aplit.tech:15675/ws' // RabbitMQ WebSocket (if available)
      ]

      let connected = false
      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying to connect to: ${endpoint}`)
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
        console.warn('⚠️ All WebSocket endpoints failed, running in mock mode')
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
      console.log('✅ WebSocket connected to MQTT bridge')
      this.isConnected = true
      this.reconnectAttempts = 0
      
      // Send MQTT CONNECT message
      this.sendMQTTConnect()
    }

    this.ws.onmessage = (event) => {
      try {
        this.handleMQTTMessage(event.data)
      } catch (error) {
        console.error('Error handling WebSocket message:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log('❌ WebSocket disconnected:', event.code, event.reason)
      this.isConnected = false
      this.handleReconnect()
    }

    this.ws.onerror = (error) => {
      console.warn('⚠️ WebSocket error (trying next endpoint):', error)
      this.isConnected = false
      this.handleReconnect()
    }
  }

  private sendMQTTConnect() {
    if (!this.ws || !this.isConnected) return

    // MQTT CONNECT message
    const connectMessage = {
      type: 'connect',
      clientId: `web_client_${Date.now()}`,
      username: 'test',
      password: 'test',
      keepAlive: 60,
      cleanSession: true,
      protocolVersion: 4 // MQTT 3.1.1
    }

    console.log('📡 Sending MQTT CONNECT message')
    this.ws.send(JSON.stringify(connectMessage))
  }

  private handleMQTTMessage(data: string) {
    try {
      const message = JSON.parse(data)
      console.log('📡 Received MQTT message:', message)
      
      switch (message.type) {
        case 'connack':
          console.log('✅ MQTT connection acknowledged')
          this.subscribeToSensorTopics()
          break
          
        case 'publish':
          this.handlePublish(message)
          break
          
        case 'suback':
          console.log('✅ Subscription acknowledged:', message.topic)
          break
          
        default:
          console.log('📡 Unknown MQTT message type:', message.type)
      }
    } catch (error) {
      // Try to handle as raw sensor data
      try {
        const sensorData = JSON.parse(data)
        if (sensorData.macAddress || sensorData.device) {
          console.log('📡 Received raw sensor data:', sensorData)
          this.handleSensorData('sensors', sensorData)
        }
      } catch (parseError) {
        console.log('📡 Received raw data:', data)
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

    topics.forEach(topic => {
      this.subscribe(topic)
    })
  }

  private handlePublish(message: any) {
    const topic = message.topic
    const payload = message.payload

    console.log(`📡 Received publish on topic ${topic}:`, payload)

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
        qos: 0,
        messageId: this.messageId++
      }
      
      console.log(`📡 Subscribing to topic: ${topic}`)
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
    console.log('🔄 Manual reconnect requested')
    this.disconnect()
    this.reconnectAttempts = 0
    setTimeout(() => {
      this.connect()
    }, 1000)
  }
}

// Export singleton instance
export const nativeMQTTClient = new NativeMQTTClient()
