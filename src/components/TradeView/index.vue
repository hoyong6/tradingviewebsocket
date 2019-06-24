<template>
  <div id="trade-view">
  </div>
</template>

<script>
import { widget as TvWidget } from '../../../static/tradeview/charting_library/charting_library.min.js' // 引入一个命名空间
import socket from './datafeeds/socket.js'
import datafeeds from './datafeeds/datafees.js'
import $ from "jquery";
const chartInterval = {
  '5': '5min',
  '15': '15min',
  '30': '30min',
  '60': '1h',
  '240': '4h',
  D: '1D'
} // 配置项目时间
const realInterval = {
  '5min': '5',
  '15min': '15',
  '30min': '30',
  '1h': '60',
  '4h': '240',
  '1D': 'D'
} // 配置项目时间
const quotaArr = [
  ['MA Cross', false, false, [5, 0]],
  ['MA Cross', false, false, [10, 0]],
  ['MA Cross', false, false, [20, 0]],
  ['MA Cross', false, false, [30, 0]]
] // 均线参数数组
export default {
  data() {
    return {
      widget: null,
      socket: new socket(),
      datafeeds: new datafeeds(this),
      symbol: null,
      interval: null,
      cacheData: {},
      lastTime: null,
      getBarTimer: null,
      isLoading: true
    }
  },
  created() {
    this.socket.doOpen()
    this.socket.on('open', () => { // 肯定是发了请求了
      this.socket.send({ cmd: 'req', args: [`candle.M5.btcusdt}`, 1440, parseInt(Date.now() / 1000)] })
    })
    this.socket.on('message', this.onMessage) // 注册函数 已经在socket.js 中封装好了
  },
  methods: {
    init(symbol = 'BTCUSDT', interval = 5) {
      let that = this
      if (!this.widget) {
        this.widget = new TvWidget({
          symbol: symbol,
          interval: interval,
          // fullscreen: true,
          container_id: 'trade-view',
          datafeed: this.datafeeds,
          library_path: '/static/tradeview/charting_library/',
          disabled_features: ['header_symbol_search'],
          enabled_features: [],
          timezone: 'Asia/Shanghai',
          locale: 'zh',
          debug: false,
          fullscreen: false, // 是否全屏
          type: 'exchanges',
          supported_resolutions: [1, 15, 240, 'D', '6M'],
          session: '24x7',
          custom_css_url: 'chartKLine.css',
          timeframe: '1W', // 工具栏背景色
          toolbar_bg: '#fff', // Regression Trend-related functionality is not implemented yet, so it's hidden for a while
          drawings_access: {
            type: 'black',
            tools: [
            {
              name: 'Regression Trend'
            }
            ]
          },
            // 禁用
          disabled_features: [
          // 用户本地存储
          'use_localstorage_for_settings',
          // 左边工具栏
          'left_toolbar',
          // 顶部工具栏
          // "header_widget_dom_node",
          // 周围边框
          'border_around_the_chart',
          // 底部时间栏目
          'timeframes_toolbar',
          // k线与销量分开
          'volume_force_overlay',
          // 图表右键菜单
          'pane_context_menu',
          // 搜索
          'header_symbol_search',
          'symbol_search_hot_key',
          // 图表属性
          'header_settings',
          // 左右箭头
          'header_undo_redo',
          // compare
          'header_compare',
          // 图表类型
          // "header_chart_type",
          // 照相机
          'header_screenshot',
          // 箭头分辨率按钮
          'header_resolutions',

          'dont_show_boolean_study_arguments',

          'header_saveload'
          // 市场图例关闭
          // "display_market_status",

          // "dont_show_boolean_study_argument",
          // "volume_force_overlay"
          // "header_indicators"
        ],
          // 图例菜单"legend_context_menu",图例设置按钮"edit_buttons_in_legend",
          // 覆盖
        overrides: {
          // 蜡烛样式
          'mainSeriesProperties.candleStyle.upColor': '#6a833a',
          'mainSeriesProperties.candleStyle.downColor': '#8a3a3b',
          // 烛心
          'mainSeriesProperties.candleStyle.drawWick': true,
          // 烛心颜色
          'mainSeriesProperties.candleStyle.wickDownColor': '#8a3a3b',
          // 边框
          'mainSeriesProperties.candleStyle.drawBorder': true,
          'mainSeriesProperties.candleStyle.borderUpColor': '#6a833a',
          'mainSeriesProperties.candleStyle.borderDownColor': '#8a3a3b',
          //    面积图《分时图》 styles
          'mainSeriesProperties.areaStyle.color2': 'rgba(65, 154, 246, 0.75)',
          'mainSeriesProperties.areaStyle.linecolor': 'rgb(178, 177, 182)',
          'mainSeriesProperties.areaStyle.linewidth': 1,
          // 背景
          'paneProperties.background': '#fff',
          // 网格线
          'paneProperties.vertGridProperties.color': '#ddd',
          'paneProperties.vertGridProperties.style': 0,
          'paneProperties.horzGridProperties.color': '#ddd',
          'paneProperties.horzGridProperties.style': 0,
          // 坐标轴和刻度标签颜色
          'scalesProperties.lineColor': '#505d7b',
          'scalesProperties.textColor': '#333e58',
          // 隐藏图例
          'paneProperties.legendProperties.showLegend': false,
          'paneProperties.legendProperties.showSeriesTitle': false,
          'scalesProperties.showLeftScale': false,
          // "scalesProperties.showRightScale":false,
          // 成交量高度
          volumePaneSize: 'medium',
          // "MACDPaneSize":"tiny"
          /* 边距 */
          'paneProperties.topMargin': 15,
          'symbolWatermarkProperties.color': 'rgba(0, 0, 0, 0)'
        },
        studies_overrides: {
          // 销量颜色
          'volume.volume.color.0': '#d4533a',
          'volume.volume.color.1': '#690'
        },
        enabled_features: [
          // 'study_templates',
          'hide_last_na_study_output', // 隐藏最后一次指标输出
          'side_toolbar_in_fullscreen_mode'
          // 'disable_resolution_rebuild'
        ],
        // 日期，时间格式化
        customFormatters: {
          timeFormatter: {
          format: function (date) {
          let _format_str = '%h:%m'
          return _format_str
          .replace('%h', date.getUTCHours(), 2)
          .replace('%m', date.getUTCMinutes(), 2)
          .replace('%s', date.getUTCSeconds(), 2)
          }
        },
        dateFormatter: {
          format: function (date) {
            return (
              date.getUTCFullYear() +
              '/' +
              (date.getUTCMonth() + 1) +
              '/' +
              date.getUTCDate()
            )
          }
        }
      }
    })
    .onChartReady(function () {
        // 设置图表分时
        let self = this
        let ChartId = that.setChartQuota(this, quotaArr)
        // 均线
        that
          .createInterval(this)
          .addClass('timeSharing')
          .attr('title', '分时')
          .text('分时')
          .on('click', function (e) {
            $(this)
              .parents('.left')
              .children()
              .find('.mydate')
              .removeAttr('style')
            $(this).css({ 'background-color': '#4e5b85', color: '#fff' })
            ChartId.forEach(function (m) {
              self
                .chart()
                .getStudyById(m)
                .setVisible(false)
            })
            self.chart().setChartType(3)
          })
        for (let i in chartInterval) {
          // 1min
          let k = chartInterval[i]
          // 15min
          let t = chartInterval[this.interval]
          that
            .createInterval(this, k, t)
            .attr('title', k)
            .text(k)
            .on('click', function (e) {
              // 切换.
              /* --- 选中样式. --- */
              $(this)
                .parents('.left')
                .children()
                .find('.mydate')
                .removeAttr('style')
              $(this).css({ 'background-color': '#4e5b85', color: '#fff' })
              /* --- 选中样式. --- */
              self.chart().setChartType(1)
              ChartId.forEach(function (m) {
                self
                  .chart()
                  .getStudyById(m)
                  .setVisible(true)
              })
              self.chart().setResolution(realInterval[$(this)[0].innerHTML], function () {
                console.log('触发了执行回调')
              })
            })
        }
      })
      this.symbol = symbol
      this.interval = interval
      }
  },
      /**
   * 创建时间按钮
   * @param widget
   * @param _k
   * @param _t
   * @returns {*}
   */
  createInterval (widget, _k, _t) {
    if (_k && _k === _t) {
      return widget
        .createButton()
        .addClass('mydate')
        .css({
          'background-color': '#4e5b85',
          color: '#fff'
        })
    }
    return widget.createButton().addClass('mydate')
  },
    /**
   * 设置图表指标线
   * @param wg
   * @param arr
   * @returns {Array}
   */
  setChartQuota (wg, arr) {
    let backArr = []
    for (let i = 0; i < arr.length; i++) {
      /* arr[i]里面的每一项的值的类型有字符串、数组、布尔，无法解决遍历问题，暂时先这样写 */
      let backId = wg
        .chart()
        .createStudy(
          arr[i][0],
          arr[i][1],
          arr[i][2],
          arr[i][3],
          arr[i][4],
          arr[i][5],
          arr[i][6]
        )
      backArr.push(backId)
    }
    return backArr
  },
    sendMessage(data) {
      if (this.socket.checkOpen()) { // 查活，否则注册方法
        this.socket.send(data)
      } else {
        this.socket.on('open', () => {
          this.socket.send(data)
        })
      }
    },
    unSubscribe(interval) {
      if (interval < 60) {
        this.sendMessage({ cmd: 'unsub', args: [`candle.M${interval}.${this.symbol.toLowerCase()}`, 1440, parseInt(Date.now() / 1000)] })
      } else if (interval >= 60) {
        this.sendMessage({ cmd: 'unsub', args: [`candle.H${interval / 60}.${this.symbol.toLowerCase()}`, 1440, parseInt(Date.now() / 1000)] })
      } else {
        this.sendMessage({ cmd: 'unsub', args: [`candle.D1.${this.symbol.toLowerCase()}`, 207, parseInt(Date.now() / 1000)] })
      }
    },
    subscribe() { //订阅发送
      if (this.interval < 60) {
        this.sendMessage({ cmd: 'sub', args: [`candle.M${this.interval}.${this.symbol.toLowerCase()}`] })
      } else if (this.interval >= 60) {
        this.sendMessage({ cmd: 'sub', args: [`candle.H${this.interval / 60}.${this.symbol.toLowerCase()}`] })
      } else {
        this.sendMessage({ cmd: 'sub', args: [`candle.D1.${this.symbol.toLowerCase()}`] })
      }
    },
    onMessage(data) { // 这个位置是联通数据后
      // console.log(data)
      if (data.data && data.data.length) {
        const list = []
        const ticker = `${this.symbol}-${this.interval}`  // BTCUSDT-15 这种鸟东西
        data.data.forEach(function (element) {
          list.push({
            time: this.interval !== 'D' || this.interval !== '1D' ? element.id * 1000 : element.id,
            open: element.open,
            high: element.high,
            low: element.low,
            close: element.close,
            volume: element.quote_vol
          })
        }, this)
        // console.log('--->查看一眼list',list)
        this.cacheData[ticker] = list
        this.lastTime = list[list.length - 1].time
        this.subscribe()
      }
      if (data.type && data.type.indexOf(this.symbol.toLowerCase()) !== -1) { // >> sub: candle.M5.btcusdt
        // console.log(' >> sub:', data.type)
        this.datafeeds.barsUpdater.updateData()
        const ticker = `${this.symbol}-${this.interval}`
        const barsData = {
          time: data.id * 1000,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          volume: data.quote_vol
        }
        if (barsData.time >= this.lastTime && this.cacheData[ticker] && this.cacheData[ticker].length) {
          this.cacheData[ticker][this.cacheData[ticker].length - 1] = barsData
        }
      }
    },
    getBars(symbolInfo, resolution, rangeStartDate, rangeEndDate, onLoadedCallback) {
      // console.log(' >> :', rangeStartDate, rangeEndDate)
      if (this.interval !== resolution) {
        this.unSubscribe(this.interval)
        this.interval = resolution
        if (resolution < 60) {
          this.sendMessage({ cmd: 'req', args: [`candle.M${this.interval}.${this.symbol.toLowerCase()}`, 1440, parseInt(Date.now() / 1000)] })
        } else if (resolution >= 60) {
          this.sendMessage({ cmd: 'req', args: [`candle.H${this.interval / 60}.${this.symbol.toLowerCase()}`, 1440, parseInt(Date.now() / 1000)] })
        } else {
          this.sendMessage({ cmd: 'req', args: [`candle.D1.${this.symbol.toLowerCase()}`, 800, parseInt(Date.now() / 1000)] })
        }
      }
      const ticker = `${this.symbol}-${this.interval}`
      if (this.cacheData[ticker] && this.cacheData[ticker].length) {
        this.isLoading = false
        const newBars = []
        this.cacheData[ticker].forEach(item => {
          if (item.time >= rangeStartDate * 1000 && item.time <= rangeEndDate * 1000) {
            newBars.push(item)
          }
        })
        onLoadedCallback(newBars)
      } else {
        const self = this
        this.getBarTimer = setTimeout(function () {
          self.getBars(symbolInfo, resolution, rangeStartDate, rangeEndDate, onLoadedCallback)
        }, 10)
      }
    }
  }
}
</script>

