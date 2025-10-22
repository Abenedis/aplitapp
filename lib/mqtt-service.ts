// MQTT Service for connecting to aplit.tech broker
export class MQTTService {
  private ws: WebSocket | null = null
  private isConnected = false
  private subscriptions = new Map<string, (data: any) => void>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 5000

  constructor() {
    this.connect()
  }

  private connect() {
    try {
      // Connect to MQTT broker via WebSocket
      // Using MQTT over WebSocket protocol
      this.ws = new WebSocket('ws://aplit.tech:8083/mqtt')
      
      this.ws.onopen = () => {
        console.log('MQTT WebSocket connected')
        this.isConnected = true
        this.reconnectAttempts = 0
        
        // Send MQTT CONNECT message
        this.sendConnectMessage()
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data)
      }

      this.ws.onclose = () => {
        console.log('MQTT WebSocket disconnected')
        this.isConnected = false
        this.handleReconnect()
      }

      this.ws.onerror = (error) => {
        console.warn('MQTT WebSocket error (trying alternative connection):', error)
        this.isConnected = false
        this.tryAlternativeConnection()
      }
    } catch (error) {
      console.error('Failed to connect to MQTT broker:', error)
      this.tryAlternativeConnection()
    }
  }

  private tryAlternativeConnection() {
    // Try direct TCP connection simulation via WebSocket
    try {
      this.ws = new WebSocket('ws://aplit.tech:9001')
      
      this.ws.onopen = () => {
        console.log('Alternative MQTT connection established')
        this.isConnected = true
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data)
      }

      this.ws.onclose = () => {
        console.log('Alternative MQTT connection closed')
        this.isConnected = false
        this.handleReconnect()
      }

      this.ws.onerror = (error) => {
        console.warn('Alternative MQTT connection failed:', error)
        this.isConnected = false
        this.handleReconnect()
      }
    } catch (error) {
      console.error('All MQTT connection attempts failed:', error)
      this.isConnected = false
    }
  }

  private sendConnectMessage() {
    if (!this.ws || !this.isConnected) return

    // MQTT CONNECT message
    const connectMessage = {
      type: 'connect',
      clientId: `web_client_${Date.now()}`,
      username: 'test',
      password: 'test',
      keepAlive: 60,
      cleanSession: true
    }

    this.ws.send(JSON.stringify(connectMessage))
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data)
      
      switch (message.type) {
        case 'connack':
          console.log('MQTT connection acknowledged')
          // Subscribe to sensor topics
          this.subscribeToTopics()
          break
          
        case 'publish':
          this.handlePublish(message)
          break
          
        default:
          console.log('Unknown message type:', message.type)
      }
    } catch (error) {
      console.error('Error parsing MQTT message:', error)
    }
  }

  private subscribeToTopics() {
    const topics = [
      'shibaSensors/temperature',
      'shibaSensors/humidity', 
      'shibaSensors/ac_current',
      'shibaSensors/opt_sensor',
      'shibaSensors/hull',
      'shibaSensors/pir',
      'shibaSensors/in2',
      'shibaSensors/dist',
      'shibaSensors/mac_address'
    ]

    topics.forEach(topic => {
      this.subscribe(topic)
    })
  }

  private subscribe(topic: string) {
    if (!this.ws || !this.isConnected) return

    const subscribeMessage = {
      type: 'subscribe',
      topics: [topic],
      qos: 0
    }

    this.ws.send(JSON.stringify(subscribeMessage))
  }

  private handlePublish(message: any) {
    const topic = message.topic
    const payload = message.payload

    // Find callback for this topic
    const callback = this.subscriptions.get(topic)
    if (callback) {
      try {
        const data = JSON.parse(payload)
        callback(data)
      } catch (error) {
        // If not JSON, treat as string
        callback(payload)
      }
    }
  }

  public subscribeToTopic(topic: string, callback: (data: any) => void) {
    this.subscriptions.set(topic, callback)
    
    if (this.isConnected) {
      this.subscribe(topic)
    }
  }

  public unsubscribeFromTopic(topic: string) {
    this.subscriptions.delete(topic)
    
    if (this.ws && this.isConnected) {
      const unsubscribeMessage = {
        type: 'unsubscribe',
        topics: [topic]
      }
      this.ws.send(JSON.stringify(unsubscribeMessage))
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

    setTimeout(() => {
      this.connect()
    }, this.reconnectInterval)
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
}

// Alternative approach using native WebSocket with MQTT.js protocol
export class SimpleMQTTClient {
  private ws: WebSocket | null = null
  private isConnected = false
  private messageId = 1
  private subscriptions = new Map<string, (data: any) => void>()

  constructor() {
    this.connect()
  }

  private connect() {
    try {
      // Try different WebSocket endpoints
      const endpoints = [
        'ws://aplit.tech:8083/mqtt',
        'ws://aplit.tech:9001',
        'ws://aplit.tech:8080/mqtt'
      ]

      let connected = false
      for (const endpoint of endpoints) {
        try {
          this.ws = new WebSocket(endpoint)
          this.setupWebSocket()
          connected = true
          break
        } catch (error) {
          console.log(`Failed to connect to ${endpoint}:`, error)
          continue
        }
      }
      
      if (!connected) {
        console.warn('All MQTT endpoints failed, running in mock mode')
        this.isConnected = false
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.isConnected = false
    }
  }

  private setupWebSocket() {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('WebSocket connected to MQTT broker')
      this.isConnected = true
    }

    this.ws.onmessage = (event) => {
      try {
        this.handleMessage(event.data)
      } catch (error) {
        console.error('Error handling WebSocket message:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      this.isConnected = false
    }

    this.ws.onerror = (error) => {
      console.warn('WebSocket error (this is expected if MQTT broker is not available):', error)
      this.isConnected = false
    }
  }

  private handleMessage(data: string) {
    try {
      // Try to parse as JSON first
      const message = JSON.parse(data)
      console.log('Received MQTT message:', message)
      
      // Handle different message formats
      if (message.topic && message.payload) {
        const callback = this.subscriptions.get(message.topic)
        if (callback) {
          callback(message.payload)
        }
      }
    } catch (error) {
      // If not JSON, treat as raw data
      console.log('Received raw data:', data)
    }
  }

  public subscribe(topic: string, callback: (data: any) => void) {
    this.subscriptions.set(topic, callback)
    
    if (this.isConnected && this.ws) {
      // Send subscription message
      const subscribeMsg = {
        type: 'subscribe',
        topic: topic,
        qos: 0,
        messageId: this.messageId++
      }
      
      this.ws.send(JSON.stringify(subscribeMsg))
    }
  }

  public unsubscribe(topic: string) {
    this.subscriptions.delete(topic)
    
    if (this.isConnected && this.ws) {
      const unsubscribeMsg = {
        type: 'unsubscribe',
        topic: topic,
        messageId: this.messageId++
      }
      
      this.ws.send(JSON.stringify(unsubscribeMsg))
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
}

// Export singleton instance with error handling
export const mqttService = (() => {
  try {
    return new SimpleMQTTClient()
  } catch (error) {
    console.warn('MQTT service initialization failed, using mock mode:', error)
    // Return a mock service that always reports as disconnected
    return {
      subscribe: () => {},
      unsubscribe: () => {},
      disconnect: () => {},
      getConnectionStatus: () => false
    }
  }
})()
