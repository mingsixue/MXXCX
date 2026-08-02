/**
 * @file 授权模块：单项/批量授权、打开设置页
 */

/**
 * 打开小程序设置页
 * @returns {Promise<WechatMiniprogram.OpenSettingSuccessCallbackResult>}
 */
const openSetting = () => {
    return new Promise((resolve, reject) => {
        wx.openSetting({
            success: resolve,
            fail: reject,
        });
    });
};

/**
 * 获取用户当前授权设置
 * @returns {Promise<WechatMiniprogram.GetSettingSuccessCallbackResult>}
 */
const getSetting = () => {
    return new Promise((resolve, reject) => {
        wx.getSetting({
            success: resolve,
            fail: reject,
        });
    });
};

/**
 * 单项授权
 * @param {string} scope 权限 scope，如 scope.userLocation
 * @returns {Promise}
 */
const authorize = (scope) => {
    return new Promise((resolve, reject) => {
        wx.authorize({
            scope,
            success: resolve,
            fail: reject,
        });
    });
};

/**
 * 批量授权：已授权跳过，未授权逐个申请
 * @param {string[]} [scopes=[]] scope 列表
 * @param {object} [options]
 * @param {boolean} [options.openSettingOnFail=false] 失败时是否引导打开设置页
 * @returns {Promise<Object.<string, boolean>>} 各 scope 是否已授权
 */
const authorizeBatch = async (scopes = [], { openSettingOnFail = false } = {}) => {
    const setting = await getSetting();
    const authSetting = setting.authSetting || {};
    const result = {};

    for (let i = 0; i < scopes.length; i++) {
        const scope = scopes[i];
        if (authSetting[scope]) {
            result[scope] = true;
            continue;
        }
        try {
            await authorize(scope);
            result[scope] = true;
        } catch (e) {
            result[scope] = false;
            if (openSettingOnFail) {
                const res = await openSetting();
                result[scope] = !!(res.authSetting && res.authSetting[scope]);
            }
        }
    }
    return result;
};

export { openSetting, getSetting, authorize, authorizeBatch };
export default { openSetting, getSetting, authorize, authorizeBatch };
