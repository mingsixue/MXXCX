/**
 * @file 系统信息 / 安全区 / 基础库版本
 */

/**
 * 获取系统信息（兼容新 API）
 * @returns {Object}
 */
const getSystemInfo = () => {
    try {
        if (wx.getWindowInfo && wx.getDeviceInfo && wx.getAppBaseInfo) {
            return {
                ...wx.getWindowInfo(),
                ...wx.getDeviceInfo(),
                ...wx.getAppBaseInfo(),
            };
        }
        return wx.getSystemInfoSync();
    } catch (e) {
        return {};
    }
};

/**
 * 获取状态栏高度（px）
 * @returns {number}
 */
const getStatusBarHeight = () => {
    const info = getSystemInfo();
    return info.statusBarHeight || 0;
};

/**
 * 获取自定义导航栏总高度（状态栏 + 44）
 * @returns {number} px
 */
const getNavBarHeight = () => {
    return getStatusBarHeight() + 44;
};

/**
 * 获取安全区信息（刘海屏 / 底部横条）
 * @returns {{ top: number, bottom: number, left: number, right: number, width: number, height: number }}
 */
const getSafeArea = () => {
    const info = getSystemInfo();
    const safe = info.safeArea || {};
    const screenHeight = info.screenHeight || info.windowHeight || 0;
    const bottom = screenHeight && safe.bottom ? screenHeight - safe.bottom : 0;
    return {
        top: safe.top || getStatusBarHeight(),
        bottom,
        left: safe.left || 0,
        right: safe.right || 0,
        width: safe.width || info.windowWidth || 0,
        height: safe.height || info.windowHeight || 0,
    };
};

/**
 * 比较基础库版本号
 * @param {string} [a=''] 版本 A
 * @param {string} [b=''] 版本 B
 * @returns {1|0|-1} a>b 返回 1，相等 0，a<b 返回 -1
 */
const compareVersion = (a = "", b = "") => {
    const pa = `${a}`.split(".").map((n) => parseInt(n, 10) || 0);
    const pb = `${b}`.split(".").map((n) => parseInt(n, 10) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        const x = pa[i] || 0;
        const y = pb[i] || 0;
        if (x > y) return 1;
        if (x < y) return -1;
    }
    return 0;
};

/**
 * 获取当前基础库版本
 * @returns {string}
 */
const getSDKVersion = () => {
    const info = getSystemInfo();
    return info.SDKVersion || "";
};

export {
    getSystemInfo,
    getStatusBarHeight,
    getNavBarHeight,
    getSafeArea,
    compareVersion,
    getSDKVersion,
};

export default {
    getSystemInfo,
    getStatusBarHeight,
    getNavBarHeight,
    getSafeArea,
    compareVersion,
    getSDKVersion,
};
