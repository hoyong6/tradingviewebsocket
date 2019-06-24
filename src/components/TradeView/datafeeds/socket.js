class socket {
  constructor(url = 'wss://exchange.ifukang.com/api/web/ws', options) {
    this.heartBeatTimer = null
    this.options = options
    this.messageMap = {}
    this.connState = 0
    this.socket = null
    this.url = url
  }
  doOpen() { // 启用socket代码
    if (this.connState) return //  这里return 不 return 一个鸟样根本不在函数流程里。下面依旧会直接执行
    this.connState = 1
    this.afterOpenEmit = []
    const BrowserWebSocket = window.WebSocket || window.MozWebSocket
    const socket = new BrowserWebSocket(this.url) // 传入请求地址
    socket.binaryType = 'arraybuffer' // 二进制类型
    socket.onopen = evt => this.onOpen(evt) // 激活几个调用函数
    socket.onclose = evt => this.onClose(evt)
    socket.onmessage = evt => this.onMessage(evt.data)
    socket.onerror = err => this.onError(err)
    this.socket = socket
  }
  onOpen(evt) {
    this.connState = 2
    this.heartBeatTimer = setInterval(this.checkHeartbeat.bind(this), 20000) // 2秒调用一次检查心跳的方法
    this.onReceiver({ Event: 'open' }) // 给定了一个open的事件方法
  }
  checkOpen() {
    return this.connState === 2
  }
  onClose() {
    this.connState = 0
    if (this.connState) { // 这个地方能进来个鬼哦
      console.log('我就想知道它什么时候能进来')
      this.onReceiver({ Event: 'close' })
    }
  }
  send(data) { // send 函数 ping 值 和 时间参数 这个包装就是发函数了外面有一层外包装
    this.socket.send(JSON.stringify(data))
  }
  emit(data) {
    return new Promise(resolve => {
      this.socket.send(JSON.stringify(data))
      this.on('message', data => {
        resolve(data)
      })
    })
  }
  onMessage(message) { // 接收到消息触发回调
    try {
      const data = JSON.parse(message)
      this.onReceiver({ Event: 'message', Data: data })
    } catch (err) {
      console.error(' >> Data parsing error:', err)
    }
  }
  checkHeartbeat() { // 检查心跳
    const data = {
      'cmd': 'ping',
      'args': [Date.parse(new Date())]
    }
    this.send(data)
  }
  onError(err) {

  }
  onReceiver(data) { // 接收端 这个时候会调用到index vue 的注册函数
    const callback = this.messageMap[data.Event]
    if (callback) callback(data.Data)
  }
  on(name, handler) { // 这个位置是绑定函数方法
    // console.log('messageMap---->', this.messageMap)
    // console.log('name--->', name)
    // console.log('handler', handler)
    this.messageMap[name] = handler
  }
  doClose() {
    this.socket.close()
  }
  destroy() { // 销毁
    if (this.heartBeatTimer) {
      clearInterval(this.heartBeatTimer)
      this.heartBeatTimer = null
    }
    this.doClose()
    this.messageMap = {}  // 消息映射
    this.connState = 0
    this.socket = null
  }
}

export default socket