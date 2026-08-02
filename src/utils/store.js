/**
 * @file 本地存储封装，支持命名空间与过期时间（秒）
 */
const store = {
    /**
     * 读取缓存
     * @param {string} key 字段名
     * @param {string} [name] 命名空间；传入时从命名空间对象中取 key
     * @returns {*} 过期或不存在时可能返回 null / ""
     */
    getItem(key, name) {
        if (name) {
            const val = this.getItem(name);
            return typeof val === "object" && val ? val[key] : "";
        }

        let v = wx.getStorageSync(key);
        if (v && typeof v === "object" && v._t) {
            let nowTime = Math.floor(+new Date() / 1000);
            if (nowTime > v._t) {
                this.remove(key);
                return null;
            }
            return v._v;
        }
        return v;
    },

    /**
     * 写入缓存
     * @param {string} key 字段名
     * @param {*} value 值
     * @param {string} [name] 命名空间
     * @param {number} [expiration] 过期秒数；>0 时启用过期
     * @returns {Promise}
     */
    setItem(key, value, name, expiration) {
        let t = 0;
        if (expiration > 0) {
            t = Math.floor(+new Date() / 1000) + expiration;
        }

        if (name) {
            let moduleData = this.getItem(name) || {};
            if (typeof moduleData !== "object" || !moduleData) {
                moduleData = {};
            }
            moduleData[key] = value;
            key = name;
            value = expiration > 0 ? { _v: moduleData, _t: t } : moduleData;
        } else if (expiration > 0) {
            value = { _v: value, _t: t };
        }

        try {
            wx.setStorageSync(key, value);
            return Promise.resolve();
        } catch (e) {
            return new Promise((resolve, reject) => {
                wx.setStorage({
                    key,
                    data: value,
                    success: resolve,
                    fail: reject,
                });
            });
        }
    },

    /**
     * 更新缓存：对象则浅合并，否则覆盖
     * @param {string} key
     * @param {*} patch
     * @param {string} [name]
     * @returns {Promise}
     */
    update(key, patch, name) {
        const current = this.getItem(key, name);
        if (typeof current === "object" && current && typeof patch === "object") {
            return this.setItem(key, { ...current, ...patch }, name);
        }
        return this.setItem(key, patch, name);
    },

    /**
     * 删除缓存字段
     * @param {string} key
     * @param {string} [name] 命名空间
     */
    remove(key, name) {
        if (name) {
            let val = this.getItem(name);
            if (typeof val === "object" && val && val[key] !== undefined) {
                delete val[key];
                this.setItem(name, val);
            }
        } else {
            wx.removeStorageSync(key);
        }
    },

    /**
     * 清空全部本地存储
     */
    clear() {
        return wx.clearStorageSync();
    },

    /**
     * 获取存储信息（keys、占用等）
     * @returns {WechatMiniprogram.GetStorageInfoSyncOption}
     */
    info() {
        return wx.getStorageInfoSync();
    },

    /**
     * 查看单条缓存原始信息（含过期时间，不自动清除过期项）
     * @param {string} key
     * @returns {{ key: string, value: *, expireAt: number, expired: boolean }}
     */
    inspect(key) {
        let raw;
        try {
            raw = wx.getStorageSync(key);
        } catch (e) {
            raw = undefined;
        }
        const now = Math.floor(Date.now() / 1000);
        let value = raw;
        let expireAt = 0;
        if (
            raw &&
            typeof raw === "object" &&
            !Array.isArray(raw) &&
            Object.prototype.hasOwnProperty.call(raw, "_t") &&
            Object.prototype.hasOwnProperty.call(raw, "_v")
        ) {
            expireAt = Number(raw._t) || 0;
            value = raw._v;
        }
        return {
            key,
            value,
            expireAt,
            expired: expireAt > 0 && now > expireAt,
        };
    },
};

export default store;
