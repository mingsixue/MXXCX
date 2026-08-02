/**
 * @file 后端环境切换
 * 测试 / 灰度 / 线上可互相切换：不同 APIHOST + Cookie，请求时自动带上
 */
import config from "../config/config";
import store from "./store";

const STORAGE_KEY = "_env";
const LEGACY_STORAGE_KEY = "_backend_env_id";

const TYPE_META = {
    test: { type: "test", label: "测试", name: "测试环境" },
    gray: { type: "gray", label: "灰度", name: "灰度环境" },
    online: { type: "online", label: "线上", name: "线上环境" },
};

/**
 * @typedef {object} BackendEnv
 * @property {string} id
 * @property {'test'|'gray'|'online'} [type]
 * @property {string} name
 * @property {string} [label]
 * @property {string} [APIHOST]
 * @property {string} [HOST]
 * @property {string} [cookie]
 */

/** @returns {BackendEnv[]} */
const getEnvList = () => {
    const list = config.ENV_LIST;
    return Array.isArray(list) ? list : [];
};

/** 当前包默认倾向的后端类型 */
const getDefaultType = () => {
    const map = {
        development: "test",
        staging: "gray",
        production: "online",
    };
    return map[config.ENV] || "test";
};

/**
 * 无本地记录时，按包环境选默认后端
 * @param {BackendEnv[]} list
 * @returns {BackendEnv}
 */
const pickDefaultEnv = (list) => {
    const prefer = getDefaultType();
    return list.find((item) => item.type === prefer) || list[0];
};

/**
 * 当前选中的后端环境
 * @returns {BackendEnv & { type: string, label: string, APIHOST: string, HOST: string, cookie: string }}
 */
const getSelectedEnv = () => {
    const list = getEnvList();
    const preferType = getDefaultType();
    const fallback = TYPE_META[preferType] || TYPE_META.test;
    const defaultCookie =
        (config.HEADER && config.HEADER.Cookie) || config.ENV_COOKIE || "";

    if (!list.length) {
        return {
            id: "default",
            type: fallback.type,
            name: fallback.name,
            label: fallback.label,
            APIHOST: config.APIHOST || "",
            HOST: config.HOST || "",
            cookie: defaultCookie,
        };
    }

    let savedId = store.getItem(STORAGE_KEY);
    if (!savedId) {
        const legacyId = store.getItem(LEGACY_STORAGE_KEY);
        if (legacyId) {
            savedId = legacyId;
            store.setItem(STORAGE_KEY, legacyId);
            store.remove(LEGACY_STORAGE_KEY);
        }
    }
    const matched =
        (savedId && list.find((item) => item.id === savedId)) ||
        pickDefaultEnv(list);

    const type = matched.type || fallback.type;
    const meta = TYPE_META[type] || fallback;

    return {
        id: matched.id,
        type,
        name: matched.name || matched.label || meta.name,
        label: matched.label || matched.name || meta.label,
        APIHOST: matched.APIHOST != null ? matched.APIHOST : config.APIHOST || "",
        HOST: matched.HOST != null ? matched.HOST : config.HOST || "",
        cookie: matched.cookie != null ? matched.cookie : defaultCookie,
    };
};

/**
 * 切换后端环境（持久化）
 * @param {string} id
 * @returns {object|null}
 */
const setSelectedEnv = (id) => {
    const list = getEnvList();
    if (!list.find((item) => item.id === id)) return null;
    store.setItem(STORAGE_KEY, id);
    const current = getSelectedEnv();
    try {
        const app = getApp();
        if (app && app.globalData) {
            app.globalData.runtimeEnv = current;
        }
    } catch (e) {
        // ignore
    }
    return current;
};

/** 当前接口域名 */
const getApiHost = () => getSelectedEnv().APIHOST || "";

/** 当前 H5 域名 */
const getH5Host = () => getSelectedEnv().HOST || "";

/** 当前环境 Cookie 值 */
const getEnvCookie = () => getSelectedEnv().cookie || "";

/**
 * 组装请求头中的环境相关字段
 * @returns {Object.<string, string>}
 */
const getEnvHeaders = () => {
    const cookie = getEnvCookie();
    if (!cookie) return {};
    const headerKey = config.ENV_COOKIE_HEADER || "Cookie";
    return { [headerKey]: cookie };
};

/** 按 type 分组：测试 / 灰度 / 线上 */
const getEnvGroups = () => {
    const list = getEnvList();
    const order = ["test", "gray", "online"];
    return order
        .map((type) => {
            const items = list.filter((item) => (item.type || "test") === type);
            if (!items.length) return null;
            const meta = TYPE_META[type] || TYPE_META.test;
            return {
                type,
                name: meta.name,
                label: meta.label,
                items,
            };
        })
        .filter(Boolean);
};

/** 启动时同步到 globalData */
const initRuntimeEnv = () => {
    const current = getSelectedEnv();
    try {
        const app = getApp();
        if (app && app.globalData) {
            app.globalData.runtimeEnv = current;
        }
    } catch (e) {
        // ignore
    }
    return current;
};

export {
    getEnvList,
    getEnvGroups,
    getSelectedEnv,
    setSelectedEnv,
    getApiHost,
    getH5Host,
    getEnvCookie,
    getEnvHeaders,
    initRuntimeEnv,
};

export default {
    getEnvList,
    getEnvGroups,
    getSelectedEnv,
    setSelectedEnv,
    getApiHost,
    getH5Host,
    getEnvCookie,
    getEnvHeaders,
    initRuntimeEnv,
};
