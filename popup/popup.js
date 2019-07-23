const trans = (function () {
    function parsePage (content, title, apiPrefix = '') {
        const apiList = []
        const apis = []
        const regExp = /\/[a-zA-Z]+\/[a-zA-Z\/]+/g
        const commitReg = /[\s\S]*\n?\s*#+ (\S+)/
        const resReg = /返回\S*\s*\n```.*((\n(?!```).*)+)/
        let result

        while (result = regExp.exec(content)) {
            const { index } = result
            try {
                const commitMatch = commitReg.exec(content.substr(0, index))
                const commit = commitMatch && commitMatch[1] || title
                const api = result[0]
                const resMatch = resReg.exec(content.substr(index))
                const res = JSON.parse(filterJsonTxt(resMatch && resMatch[1] || '{}'))
        
                apiList.push(`\n// ${commit}\n`
                    + `'${apiPrefix}${api}': `
                    + JSON.stringify(res.code ? (res.data || true) : res, undefined, 4)
                )
                apis.push(api)
            } catch (e) {
                console.error(e)
            }
        }

        return [apiList, apis]
    }

    function filterJsonTxt (txt) {
        return txt
            // html
            .replace(/&gt;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&nbsp;/g, " ")
            .replace(/&#39;/g, "\'")
            .replace(/&quot;/g, "\"")
            // fix
            .replace(/，\n/g, ',\n')
            .replace(/：/g, ':')
            .replace(/((\{|\[|,)\s*)“/g, '$1"')
            .replace(/,(\s*(\}|\]))/g, '$1')
    }
    return function ({ fetch, server, menuApi, pageApi, itemIdForMenu, menuPath, apiPrefix }) {
        function baseAjax (url, params) {
            return fetch(server + url, params).then((data) => {
                if (!data || data.error_code !== 0) {
                    return Promise.reject()
                }
        
                return Promise.resolve(data.data)
            })
        }

        function getPageInfo (id) {
            return baseAjax(pageApi, {
                page_id: id
            }).then(data => {
                return Promise.resolve(data || '')
            })
        }

        return {
            getPageIds: function getPageIds () {
                return baseAjax(menuApi, {
                    item_id: itemIdForMenu
                }).then(({ menu }) => {
                    return Promise.resolve(menuPath.reduce((m, i) => {
                        return m.catalogs.find(item => item.cat_name === i)
                    }, menu).pages.map(item => item.page_id))
                })
            },
            loadApis: async function loadApis (ids) {
                let apiTxt = ''
                for (let id of ids) {
                    const { page_content, page_title } = await getPageInfo(id)
                    const [apis] = parsePage(page_content, page_title, apiPrefix)
                    apiTxt += apis.join(',') + ','
                }

                return apiTxt
            }
        }
    }
})()

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