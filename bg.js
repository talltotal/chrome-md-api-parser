/**
 * 在必要的时候加载，不需要的时候
 * 加载时机：
 * 1. 插件第一次下载/更新插件版本
 * 2. 监听的事件被触发
 * 3. content script/其他插件send msg
 * 4. 插件执行了`runtime.getBackgroundPage`
 * 加载之后，就会一直在后台挂着，直到所有页面关闭。
 * 在onInstalled事件中定义首次必要的内容
 */

chrome.tabs.onSelectionChanged.addListener((tabId) => {
  chrome.tabs.get(tabId, ({ url }) => {
    if (url && url.match(/\/web\/#\/\d+\?page_id=\d+/)) {
      chrome.pageAction.show(tabId)
    }
  })
})
