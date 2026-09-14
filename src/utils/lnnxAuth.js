/**
 * @file 流年凝雪静默登录（openid 白名单 → JWT）
 */
import { get, post } from "./request";
import { clearUser, getIsLogin, getToken, setUserAllInfo } from "./user";

const AUTH_SKIP = {
    "auth/login": true,
    "auth/me": true,
};

let loginPromise = null;
let lastDeniedOpenid = "";

/**
 * 是否鉴权接口（请求层跳过等待 loginReady，避免死锁）
 * @param {string} url
 * @returns {boolean}
 */
const isAuthUrl = (url = "") => !!AUTH_SKIP[String(url).replace(/^\//, "")];

/**
 * 最近一次因未进白名单被拒绝时的 openid（便于录入）
 * @returns {string}
 */
const getLastDeniedOpenid = () => lastDeniedOpenid;

/**
 * @returns {Promise<string>}
 */
const wxLoginCode = () =>
    new Promise((resolve, reject) => {
        wx.login({
            success: (res) => {
                if (res && res.code) {
                    resolve(res.code);
                    return;
                }
                reject(new Error("wx.login 未返回 code"));
            },
            fail: (err) => reject(err || new Error("wx.login 失败")),
        });
    });

/**
 * 把登录结果写入本地
 * @param {object} data
 * @returns {object}
 */
const applyLoginData = (data = {}) => {
    const user = data.user || {};
    const token = data.token || "";
    return setUserAllInfo({
        id: user.id,
        token,
        openid: user.openid || "",
        nickname: user.nickname || "",
        nickName: user.nickname || "",
        role: user.role || "",
        affiliation: user.affiliation || 0,
        affiliation_name: user.affiliation_name || "",
    });
};

/**
 * 用 code 换 token
 * @returns {Promise<object>}
 */
const loginByCode = async () => {
    const code = await wxLoginCode();
    try {
        const data = await post(
            "auth/login",
            { code },
            {
                silent: true,
                dedupe: false,
                onError: () => true,
            }
        );
        lastDeniedOpenid = "";
        return applyLoginData(data);
    } catch (body) {
        const openid = body && body.data && body.data.openid ? String(body.data.openid) : "";
        if (openid) {
            lastDeniedOpenid = openid;
            try {
                wx.setStorageSync("_lnnx_denied_openid", openid);
            } catch (e) {
                // ignore
            }
        }
        clearUser();
        const err = new Error((body && body.message) || "登录失败");
        err.body = body;
        err.openid = openid;
        throw err;
    }
};

/**
 * 用已有 token 拉取 / 校验当前用户
 * @returns {Promise<object|null>}
 */
const refreshMe = async () => {
    const token = getToken();
    if (!token) return null;
    try {
        const me = await get(
            "auth/me",
            {},
            {
                silent: true,
                dedupe: false,
                onError: () => true,
            }
        );
        return setUserAllInfo({
            id: me.id,
            token,
            openid: me.openid || "",
            nickname: me.nickname || "",
            nickName: me.nickname || "",
            role: me.role || "",
            affiliation: me.affiliation || 0,
            affiliation_name: me.affiliation_name || "",
        });
    } catch (e) {
        clearUser();
        return null;
    }
};

/**
 * 确保已登录（并发合并为一次）
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<object>}
 */
const ensureLnnxLogin = (options = {}) => {
    const force = !!options.force;
    if (loginPromise) return loginPromise;

    loginPromise = (async () => {
        try {
            if (!force && getIsLogin()) {
                const me = await refreshMe();
                if (me) return me;
            }
            return await loginByCode();
        } finally {
            loginPromise = null;
        }
    })();

    return loginPromise;
};

export {
    isAuthUrl,
    getLastDeniedOpenid,
    ensureLnnxLogin,
    loginByCode,
    refreshMe,
};

export default {
    isAuthUrl,
    getLastDeniedOpenid,
    ensureLnnxLogin,
    loginByCode,
    refreshMe,
};
