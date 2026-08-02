/**
 * @file 订阅消息封装
 */

/**
 * 请求订阅消息授权
 * @param {string[]} [tmplIds=[]] 模板 id 列表
 * @returns {Promise<Object>} 各模板授权结果
 */
const requestSubscribeMessage = (tmplIds = []) => {
    return new Promise((resolve, reject) => {
        if (!tmplIds.length) {
            reject(new Error("tmplIds 不能为空"));
            return;
        }
        wx.requestSubscribeMessage({
            tmplIds,
            success: resolve,
            fail: reject,
        });
    });
};

export { requestSubscribeMessage };
export default { requestSubscribeMessage };
