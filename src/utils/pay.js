/**
 * @file 微信支付封装
 */

/**
 * 调起微信支付
 * @param {object} params requestPayment 参数
 * @param {string} params.timeStamp
 * @param {string} params.nonceStr
 * @param {string} params.package
 * @param {string} [params.signType]
 * @param {string} params.paySign
 * @returns {Promise}
 */
const requestPayment = (params = {}) => {
    return new Promise((resolve, reject) => {
        wx.requestPayment({
            ...params,
            success: resolve,
            fail: reject,
        });
    });
};

/**
 * 使用下单结果发起支付（真实环境应先请求后端下单）
 * @param {object} orderParams 含 timeStamp 等支付参数
 * @returns {Promise}
 */
const payWithOrder = async (orderParams) => {
    if (!orderParams || !orderParams.timeStamp) {
        throw new Error("缺少支付参数，请先对接下单接口");
    }
    return requestPayment(orderParams);
};

export { requestPayment, payWithOrder };
export default { requestPayment, payWithOrder };
