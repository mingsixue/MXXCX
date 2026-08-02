import MX from "@utils/index";

Page({
    data: { tmplIds: "" },

    onInput(e) {
        this.setData({ tmplIds: e.detail.value });
    },

    async handleSubscribe() {
        const ids = (this.data.tmplIds || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        if (!ids.length) {
            wx.showToast({ title: "请填写模板 ID", icon: "none" });
            return;
        }
        try {
            const res = await MX.subscribe.requestSubscribeMessage(ids);
            wx.showModal({
                title: "订阅结果",
                content: JSON.stringify(res),
                showCancel: false,
            });
        } catch (e) {
            wx.showToast({ title: e.errMsg || "订阅失败", icon: "none" });
        }
    },
});
