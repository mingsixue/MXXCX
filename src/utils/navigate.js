/**
 * @file 页面跳转：小程序内导航、H5/webview、第三方小程序
 */
import config from "../config/config";
import { addQuery, parseUrl } from "./page";
import { getH5Host } from "./env";

/** 首页路径（用于 reLaunch） */
const HOME_PATH = "/pages/index/index";

/**
 * 规范化路径，保证以 / 开头
 * @param {string} [url='']
 * @returns {string}
 */
const normalizePath = (url = "") => {
    if (!url) return "";
    return url.startsWith("/") ? url : `/${url}`;
};

/**
 * 小程序内跳转；页面栈 >= 8 时自动改用 redirectTo，首页走 reLaunch
 * @param {string} url 页面路径，可带 query
 * @param {string} [type] 强制跳转方式：navigateTo / redirectTo / reLaunch / switchTab
 */
const go = (url, type) => {
    const target = normalizePath(url);
    if (!target) return;

    if (parseUrl(target).path === HOME_PATH || target.indexOf("pages/index/index") > -1) {
        wx.reLaunch({ url: target });
        return;
    }

    if (type && typeof wx[type] === "function") {
        wx[type]({ url: target });
        return;
    }

    const pages = getCurrentPages();
    if (pages.length < 8) {
        wx.navigateTo({ url: target });
    } else {
        wx.redirectTo({ url: target });
    }
};

/**
 * 返回上一页；栈底则 reLaunch 到首页
 * @param {number} [delta=1] 返回层数
 */
const back = (delta = 1) => {
    const pages = getCurrentPages();
    if (pages.length > 1) {
        wx.navigateBack({ delta: Math.min(delta, pages.length - 1) });
    } else {
        wx.reLaunch({ url: HOME_PATH });
    }
};

/**
 * 打开 H5（跳转 webview 页）
 * @param {string} url 完整 https 地址或相对 HOST 的路径
 * @param {Object} [extra={}] 额外 query
 */
const openWebview = (url, extra = {}) => {
    if (!url) return;
    let href = url;
    const h5Host = getH5Host();
    if (h5Host && href.indexOf("http") !== 0) {
        href = `${h5Host}${href.startsWith("/") ? "" : "/"}${href}`;
    }
    const page = config.WEBVIEW_PAGE || "/packageDemo/webview/index";
    go(addQuery(page, { url: href, ...extra }));
};

/**
 * 跳转第三方小程序
 * @param {WechatMiniprogram.NavigateToMiniProgramOption} [options={}]
 * @returns {Promise}
 */
const toMiniProgram = (options = {}) => {
    return new Promise((resolve, reject) => {
        wx.navigateToMiniProgram({
            ...options,
            success: resolve,
            fail: reject,
        });
    });
};

export { go, back, openWebview, toMiniProgram, HOME_PATH };
export default { go, back, openWebview, toMiniProgram, HOME_PATH };
