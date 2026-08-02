/**
 * @file 错误 / 自定义上报
 */
import config from "../config/config";
import { getCurrentPageInfo } from "./page";
import { getSystemInfo } from "./system";

/**
 * 上报自定义数据；未配置 REPORT_URL 时仅打印控制台
 * @param {Object} [payload={}] 业务字段
 * @returns {Promise}
 */
const report = (payload = {}) => {
    const body = {
        ...payload,
        version: config.VERSION,
        env: config.ENV,
        page: getCurrentPageInfo(),
        system: getSystemInfo(),
        time: Date.now(),
    };

    if (!config.REPORT_URL) {
        console.log("[report]", body);
        return Promise.resolve(body);
    }

    return new Promise((resolve) => {
        wx.request({
            url: config.REPORT_URL,
            method: "POST",
            data: body,
            success: resolve,
            fail: () => resolve(body),
        });
    });
};

/**
 * 捕获并上报错误
 * @param {Error|Object|string} error
 * @param {Object} [extra={}] 附加字段
 * @returns {Promise}
 */
const captureError = (error, extra = {}) => {
    return report({
        type: "error",
        message: error && (error.message || error.errMsg || `${error}`),
        stack: error && error.stack,
        ...extra,
    });
};

export { report, captureError };
export default { report, captureError };
