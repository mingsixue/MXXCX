/**
 * @file 页面信息与 query 处理
 */

/**
 * 解析 query 字符串为对象
 * @param {string} [queryStr=''] 如 a=1&b=2 或 ?a=1&b=2
 * @returns {Object.<string, string>}
 */
const parseQuery = (queryStr = "") => {
    const query = {};
    const str = queryStr.replace(/^\?/, "");
    if (!str) return query;
    str.split("&").forEach((pair) => {
        if (!pair) return;
        const [key, ...rest] = pair.split("=");
        query[key] = decodeURIComponent(rest.join("=") || "");
    });
    return query;
};

/**
 * 将对象拼接为 query 字符串（不含 ?）
 * @param {Object} [data={}]
 * @returns {string}
 */
const stringifyQuery = (data = {}) => {
    return Object.keys(data || {})
        .filter((k) => data[k] !== undefined && data[k] !== null)
        .map((k) => `${k}=${encodeURIComponent(data[k])}`)
        .join("&");
};

/**
 * 解析完整 url 为 path + query
 * @param {string} [url='']
 * @returns {{ path: string, query: Object.<string, string> }}
 */
const parseUrl = (url = "") => {
    const [path, queryStr = ""] = `${url}`.split("?");
    return {
        path,
        query: parseQuery(queryStr),
    };
};

/**
 * 为 url 增加 / 覆盖 query 参数
 * @param {string} [url='']
 * @param {Object} [data={}]
 * @returns {string}
 */
const addQuery = (url = "", data = {}) => {
    const { path, query } = parseUrl(url);
    const next = { ...query, ...data };
    const q = stringifyQuery(next);
    return q ? `${path}?${q}` : path;
};

/**
 * 从 url 中删除指定 query 参数
 * @param {string} [url='']
 * @param {string|string[]} [keys=[]] 要删除的 key
 * @returns {string}
 */
const removeQuery = (url = "", keys = []) => {
    const { path, query } = parseUrl(url);
    const list = Array.isArray(keys) ? keys : [keys];
    list.forEach((k) => {
        delete query[k];
    });
    const q = stringifyQuery(query);
    return q ? `${path}?${q}` : path;
};

/**
 * 获取当前页面实例
 * @returns {WechatMiniprogram.Page.Instance|null}
 */
const getCurrentPage = () => {
    const pages = getCurrentPages();
    return pages[pages.length - 1] || null;
};

/**
 * 获取上一页面实例
 * @returns {WechatMiniprogram.Page.Instance|null}
 */
const getPrevPage = () => {
    const pages = getCurrentPages();
    return pages.length > 1 ? pages[pages.length - 2] : null;
};

/**
 * 获取当前页面路由信息
 * @returns {{ route: string, options: Object, fullPath: string }}
 */
const getCurrentPageInfo = () => {
    const page = getCurrentPage();
    if (!page) return { route: "", options: {}, fullPath: "" };
    const route = `/${page.route || ""}`;
    const options = page.options || {};
    const q = stringifyQuery(options);
    return {
        route,
        options,
        fullPath: q ? `${route}?${q}` : route,
    };
};

/**
 * 获取上一页面路由信息
 * @returns {{ route: string, options: Object, fullPath: string }|null}
 */
const getPrevPageInfo = () => {
    const page = getPrevPage();
    if (!page) return null;
    const route = `/${page.route || ""}`;
    const options = page.options || {};
    const q = stringifyQuery(options);
    return {
        route,
        options,
        fullPath: q ? `${route}?${q}` : route,
    };
};

export {
    parseQuery,
    stringifyQuery,
    parseUrl,
    addQuery,
    removeQuery,
    getCurrentPage,
    getPrevPage,
    getCurrentPageInfo,
    getPrevPageInfo,
};

export default {
    parseQuery,
    stringifyQuery,
    parseUrl,
    addQuery,
    removeQuery,
    getCurrentPage,
    getPrevPage,
    getCurrentPageInfo,
    getPrevPageInfo,
};
