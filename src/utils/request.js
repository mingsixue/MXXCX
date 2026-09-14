/**
 * @file 网络请求封装
 * 支持 get/post、登录过期拦截、请求取消、同 key 去重、统一/自定义错误处理
 */
import config from "../config/config";
import { clearUser, getToken } from "./user";
import { getApiHost, getEnvHeaders, getSelectedEnv } from "./env";

const pendingMap = new Map();
const REQUEST_LOG_KEY = "_debug_request_logs";
const MAX_REQUEST_LOGS = 50;

/** @type {object[]|null} */
let requestLogs = null;
/** @type {string} YYYY-MM-DD */
let requestLogsDay = "";

const todayKey = () => {
    const d = new Date();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
};

const syncRequestLogsGlobal = () => {
    try {
        const app = getApp();
        if (app && app.globalData) {
            app.globalData.requestLogs = requestLogs || [];
        }
    } catch (e) {
        // ignore
    }
};

const persistRequestLogs = () => {
    if (!config.ENABLE_DEBUG) return;
    try {
        wx.setStorageSync(REQUEST_LOG_KEY, {
            day: requestLogsDay || todayKey(),
            list: requestLogs || [],
        });
    } catch (e) {
        // 存储配额满等忽略，内存日志仍可用
    }
};

/**
 * 加载当天请求日志；跨天则清空
 */
const ensureRequestLogs = () => {
    const day = todayKey();
    if (requestLogs !== null && requestLogsDay === day) {
        return requestLogs;
    }

    let list = [];
    if (config.ENABLE_DEBUG) {
        try {
            const saved = wx.getStorageSync(REQUEST_LOG_KEY);
            if (saved && saved.day === day && Array.isArray(saved.list)) {
                list = saved.list;
            } else if (saved) {
                wx.removeStorageSync(REQUEST_LOG_KEY);
            }
        } catch (e) {
            // ignore
        }
    }

    requestLogs = list;
    requestLogsDay = day;
    syncRequestLogsGlobal();
    return requestLogs;
};

/**
 * 获取最近请求日志（供 Debug 小绿点使用，仅当天）
 * @returns {object[]}
 */
const getRequestLogs = () => ensureRequestLogs().slice();

/**
 * 清空请求日志
 */
const clearRequestLogs = () => {
    requestLogs = [];
    requestLogsDay = todayKey();
    syncRequestLogsGlobal();
    if (config.ENABLE_DEBUG) {
        try {
            wx.removeStorageSync(REQUEST_LOG_KEY);
        } catch (e) {
            // ignore
        }
    }
};

const pushLog = (item) => {
    ensureRequestLogs();
    requestLogs.unshift(item);
    if (requestLogs.length > MAX_REQUEST_LOGS) requestLogs.length = MAX_REQUEST_LOGS;
    syncRequestLogsGlobal();
    persistRequestLogs();
};

const clearAuth = () => {
    clearUser();
};

const getRequestKey = (options) => {
    if (options.requestKey) return options.requestKey;
    return `${(options.method || "GET").toUpperCase()} ${options.url} ${JSON.stringify(
        options.data || {}
    )}`;
};

/**
 * 取消指定 key 的进行中请求
 * @param {string} key
 */
const abortPending = (key) => {
    if (pendingMap.has(key)) {
        try {
            pendingMap.get(key).abort();
        } catch (e) {
            // ignore
        }
        pendingMap.delete(key);
    }
};

/**
 * 发起 HTTP 请求
 * @param {object} options
 * @param {string} options.url 相对 APIHOST 的路径
 * @param {string} [options.method='GET']
 * @param {object} [options.data]
 * @param {object} [options.header]
 * @param {number} [options.timeout=10000]
 * @param {boolean} [options.isfail] 业务失败也走 resolve，自行处理
 * @param {boolean} [options.silent] 不弹默认错误提示
 * @param {function} [options.onError] 自定义错误处理，返回 true 则不再弹默认窗
 * @param {boolean} [options.dedupe=true] 相同请求去重（取消前一个）
 * @param {string} [options.requestKey] 自定义去重 key
 * @param {function} [options.success] 兼容回调
 * @param {function} [options.fail] 兼容回调
 * @returns {Promise & { abort: Function }}
 */
const request = (options = {}) => {
    const userToken = getToken();
    const key = getRequestKey(options);
    const dedupe = options.dedupe !== false;

    if (dedupe) abortPending(key);

    let task = null;
    const start = Date.now();

    const promise = new Promise((resolve, reject) => {
        const runtimeEnv = getSelectedEnv();
        const requestHeader = {
            "content-type": "application/json",
            ...(userToken ? { Authorization: userToken } : {}),
            ...getEnvHeaders(),
            ...(options.header || {}),
        };
        task = wx.request({
            url: `${getApiHost()}${options.url}`,
            data: options.data || {},
            header: requestHeader,
            timeout: options.timeout || 10000,
            method: (options.method || "GET").toUpperCase(),
            dataType: "json",
            success(res) {
                pendingMap.delete(key);
                const body = res.data || {};
                const { statusCode, message, data } = body;

                pushLog({
                    url: options.url,
                    method: options.method || "GET",
                    statusCode,
                    message,
                    duration: Date.now() - start,
                    time: Date.now(),
                    data: options.data,
                    response: body,
                    header: requestHeader,
                    apiHost: runtimeEnv.APIHOST,
                    envName: runtimeEnv.name,
                    cookie: runtimeEnv.cookie,
                });

                if (options.isfail) {
                    options.success && options.success(body);
                    resolve(body);
                    return;
                }

                if (statusCode == "1" || statusCode === 1) {
                    options.success && options.success(data);
                    resolve(data);
                    return;
                }

                if (message == "jwt expired" || message == "成员不存在" || statusCode == "401") {
                    clearAuth();
                    const handled =
                        options.onError &&
                        options.onError({ type: "auth", message, body }) === true;
                    if (!handled) {
                        wx.showToast({
                            title: "登录已失效，请重新登录",
                            icon: "none",
                        });
                    }
                    reject(body);
                    return;
                }

                const handled =
                    options.onError &&
                    options.onError({ type: "business", message, body }) === true;
                if (!handled && !options.silent) {
                    wx.showModal({
                        title: "系统提示",
                        content: message || "请求失败",
                        showCancel: false,
                    });
                }
                options.fail && options.fail(body);
                reject(body);
            },
            fail(err) {
                pendingMap.delete(key);
                pushLog({
                    url: options.url,
                    method: options.method || "GET",
                    statusCode: "NETWORK_ERROR",
                    message: err.errMsg,
                    duration: Date.now() - start,
                    time: Date.now(),
                    data: options.data,
                    response: err,
                    header: requestHeader,
                    apiHost: runtimeEnv.APIHOST,
                    envName: runtimeEnv.name,
                    cookie: runtimeEnv.cookie,
                });
                const handled =
                    options.onError &&
                    options.onError({ type: "network", message: err.errMsg, body: err }) === true;
                if (!handled && !options.silent) {
                    wx.showToast({
                        title: "网络异常，请稍后重试",
                        icon: "none",
                    });
                }
                options.fail && options.fail(err);
                reject(err);
            },
        });

        pendingMap.set(key, task);
    });

    promise.abort = () => {
        abortPending(key);
    };

    return promise;
};

/**
 * GET 请求
 * @param {string} url
 * @param {object} [data]
 * @param {object} [options] 其余 request 选项
 * @returns {Promise}
 */
const get = (url, data, options = {}) => request({ ...options, url, data, method: "GET" });

/**
 * POST 请求
 * @param {string} url
 * @param {object} [data]
 * @param {object} [options] 其余 request 选项
 * @returns {Promise}
 */
const post = (url, data, options = {}) => request({ ...options, url, data, method: "POST" });

export { request, get, post, getRequestLogs, clearRequestLogs, abortPending };
export default request;
