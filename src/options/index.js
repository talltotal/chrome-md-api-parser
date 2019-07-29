const content = document.getElementById('content')
let cssUrlMap
const listTemp = function (obj) {
  let html = '<ul>'
  for (const key in obj) {
    const item = obj[key]
    html += `<li><input class="item-url" type="text" value="${key}" /><textarea class="item-css">${item.css}</textarea><div class="item-control"><div class="item-open open-${item.isOpen}"></div><div class="item-del">删除</div></div></li>`
  }
  html += '<li><div class="add-item">+</div></li>'
  html += '</ul><button type="submit">确认</button><div class="tip">确认后刷新页面查看效果！</div>'

  return html
}
content.addEventListener('click', function (event) {
  const target = event.target
  const className = target.className
  if (className.match('item-open')) {
    if (className.match('open-true')) {
      target.className = 'item-open open-false'
    } else {
      target.className = 'item-open open-true'
    }
  } else if (className.match('item-del')) {
    const p = event.target.parentElement.parentElement
    p.parentElement.removeChild(p)
  } else if (className.match('add-item')) {
    const list = content.querySelector('ul')
    const childNodes = list.childNodes
    const newItem = document.createElement('li')

    newItem.innerHTML = '<input class="item-url" type="text" /><textarea class="item-css"></textarea><div class="item-control"><div class="item-open open-true"></div><div class="item-del">删除</div></div>'

    list.insertBefore(newItem, childNodes[childNodes.length - 1])
  } else if (target.tagName === 'BUTTON') {
    const newMap = {}
    const inputList = content.querySelectorAll('input')
    for (let i = 0; i < inputList.length; i++) {
      const item = inputList[i]
      const url = item.value
      if (url) {
        const textarea = item.nextElementSibling
        const radio = textarea.nextElementSibling.querySelector('.item-open')
        newMap[url] = {
          isOpen: !radio.className.match('open-false'),
          css: textarea.value
        }
      }
    }
    chrome.storage.sync.set({ CssUrlMap: newMap })
  }
})
chrome.storage.sync.get('CssUrlMap', function (data) {
  cssUrlMap = data.CssUrlMap
  content.innerHTML = listTemp(cssUrlMap)
})