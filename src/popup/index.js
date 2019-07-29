const trans = require('../core')

const $form = document.getElementById('form')
const $types = document.getElementsByName('type')
const $menuPath = document.getElementById('menuPath')

const menuApi = '/api/item/info'
const pageApi = '/api/page/info'
const baseApi = '/server/index.php?s='
let host = ''
let itemIdForMenu = 0
let currPageId = 0

$types.forEach(el => {
    el.onchange = function () {
        if (getType() === '0') {
            $menuPath.value = ''
            $menuPath.style.display = 'none'
        } else {
            $menuPath.style.display = ''
        }
    }
})

$form.onsubmit = function () {
    const server = `${host}${baseApi}`
    const useMenu = getType() === '1'
    const menuPath = $menuPath.value.split(',')


    const { getPageIds, loadApis } = trans({
        fetch: (url, params) => {
            return new Promise((resolve, reject) => {
                let formStr = []
                for (key in params) {
                    formStr.push(`${key}=${params[key]}`)
                }
                formStr = formStr.join('&')
                const xhr = new XMLHttpRequest()
                xhr.onload = () => {
                    if (xhr.status === 200) {
                        resolve(xhr.response)
                    } else {
                        reject()
                    }
                }
                xhr.responseType = 'json'
                xhr.open('post', url, true);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8')
                xhr.setRequestHeader('Accept', 'application/json, text/plain, */*')
                xhr.setRequestHeader('Accept-Language', 'zh-CN,zh;q=0.9')
                xhr.send(formStr)
            })
        },
        server,
        menuApi,
        pageApi,
        itemIdForMenu,
        menuPath
    })

    if (useMenu) {
        getPageIds().then(ids => {
            loadApis(ids).then(txt => {
                saveFile(txt)
            })
        })
    } else {
        loadApis([currPageId]).then(txt => {
            saveFile(txt)
        })
    }

    return false
}

chrome.tabs.query({ active: true }, function (tab) {
    const { url } = tab[0]
    const urlMatch = url.match(/^(.+)\/web\/#\/(\d+)\?page_id=(\d+)/)
    host = urlMatch[1]
    itemIdForMenu = urlMatch[2]
    currPageId = urlMatch[3]
})

function getType () {
    let type = 0
    $types.forEach(item => {
        if (item.checked) {
            type = item.value
        }
    })

    return type
}

function saveFile (txt) {
    chrome.downloads.download({
        saveAs: true,
        url: URL.createObjectURL(new Blob([`module.exports = {${txt}}`], { type: 'text/javascript' }))
    }, function(downloadId){
        console.log("download begin, the downId is:" + downloadId);
    })
}