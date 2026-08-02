/**
 * @file 用户信息 / 登录态
 */
import store from "./store";
import config from "../config/config";

/**
 * 安全获取 App 实例（极早阶段可能不可用）
 * @returns {WechatMiniprogram.App.Instance|null}
 */
const getAppSafe = () => {
    try {
        return getApp();
    } catch (e) {
        return null;
    }
};

/**
 * 获取本地缓存的用户信息
 * @returns {Object}
 */
const getUserInfo = () => store.getItem("_userInfo") || {};

/**
 * 获取 token
 * @returns {string}
 */
const getToken = () => getUserInfo().token || "";

/**
 * 是否已登录（以 token 为准）
 * @returns {boolean}
 */
const getIsLogin = () => !!getToken();

/**
 * 获取用户 id
 * @returns {*}
 */
const getUserId = () => getUserInfo().id;

/**
 * 更新用户信息单个字段
 * @param {string} key
 * @param {*} val
 */
const setUserInfo = (key, val) => {
    const user = getUserInfo();
    user[key] = val;
    store.setItem("_userInfo", user);
    const app = getAppSafe();
    if (app) {
        app.globalData.user = user;
        app.globalData.isLogin = !!user.token;
    }
};

/**
 * 合并写入用户信息
 * @param {Object} [info={}]
 * @returns {Object} 合并后的用户对象
 */
const setUserAllInfo = (info = {}) => {
    const newUser = { ...getUserInfo(), ...info };
    store.setItem("_userInfo", newUser);
    const app = getAppSafe();
    if (app) {
        app.globalData.user = newUser;
        app.globalData.isLogin = !!newUser.token;
    }
    return newUser;
};

/**
 * 清除本地登录态
 */
const clearUser = () => {
    store.remove("_userInfo");
    const app = getAppSafe();
    if (app) {
        app.globalData.user = null;
        app.globalData.isLogin = false;
    }
};

/**
 * 检查登录态；未登录则 toast 并跳转登录页
 * @param {string|number} [userId] 可选，带入登录页 query
 * @returns {boolean} 已登录返回 true
 */
const checkLogin = (userId) => {
    if (getIsLogin()) return true;
    const loginPage = config.LOGIN_PAGE || "/packageDemo/login/index";
    wx.showToast({
        title: "您需要登录查看",
        icon: "none",
        duration: 2000,
        success: () => {
            setTimeout(() => {
                const url = userId ? `${loginPage}?userId=${userId}` : loginPage;
                wx.navigateTo({ url });
            }, 1500);
        },
    });
    return false;
};

export {
    getUserInfo,
    getToken,
    getIsLogin,
    getUserId,
    setUserInfo,
    setUserAllInfo,
    clearUser,
    checkLogin,
};

export default {
    getUserInfo,
    getToken,
    getIsLogin,
    getUserId,
    setUserInfo,
    setUserAllInfo,
    clearUser,
    checkLogin,
};
