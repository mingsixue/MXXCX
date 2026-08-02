import MX from "@utils/index";
import config from "../../config/config";

Page({
    data: {
        stackTip: "",
        appIds: config.MINI_PROGRAM_APPIDS || [],
    },

    onShow() {
        const pages = getCurrentPages();
        this.setData({
            stackTip: `当前页面栈：${pages.length} / 10（框架在 >=8 时自动 redirectTo）`,
        });
    },

    handlePushSelf() {
        MX.go("/packageDemo/navigate/index?t=" + Date.now());
    },

    handleWebview() {
        MX.openWebview("https://www.mingsixue.com/mxwui/");
    },

    handleMiniProgram() {
        const appId = (config.MINI_PROGRAM_APPIDS || [])[0];
        if (!appId) {
            wx.showToast({
                title: "请先在 config.MINI_PROGRAM_APPIDS 配置",
                icon: "none",
            });
            return;
        }
        MX.toMiniProgram({ appId, path: "pages/index/index" }).catch((err) => {
            wx.showToast({ title: err.errMsg || "跳转失败", icon: "none" });
        });
    },

    handleBack() {
        MX.back();
    },
});
