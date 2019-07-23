module.exports = ({ fetch, server, menuApi, pageApi, itemIdForMenu, menuPath, apiPrefix }) => {
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
