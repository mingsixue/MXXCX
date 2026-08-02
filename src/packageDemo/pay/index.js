import MX from "@utils/index";

Page({
    data: { tip: "真实支付需后端下单返回 timeStamp/nonceStr/package/paySign" },

    async handlePay() {
        try {
            // mock：演示调用链，缺少参数会提示
            await MX.pay.payWithOrder({});
        } catch (e) {
            wx.showModal({
                title: "支付示例",
                content: e.message || "请对接下单接口后传入支付参数",
                showCancel: false,
            });
        }
    },

    async handlePayMockSuccess() {
        // 仅演示 API 形状；真机无有效签名会失败
        try {
            await MX.pay.requestPayment({
                timeStamp: `${Math.floor(Date.now() / 1000)}`,
                nonceStr: MX.randomString(16),
                package: "prepay_id=mock",
                signType: "RSA",
                paySign: "mock",
            });
        } catch (e) {
            wx.showToast({ title: e.errMsg || "支付取消/失败", icon: "none" });
        }
    },
});
