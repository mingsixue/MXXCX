import MX from "@utils/index";

Page({
    data: {
        code: "",
        openid: "",
        user: null,
        loading: false,
        isLogin: false,
    },

    onShow() {
        this.refreshLocal();
    },

    refreshLocal() {
        const user = MX.getUserInfo() || {};
        let denied = "";
        try {
            denied = wx.getStorageSync("_lnnx_denied_openid") || "";
        } catch (e) {
            denied = "";
        }
        this.setData({
            isLogin: MX.getIsLogin(),
            user: user.token ? user : null,
            openid: user.openid || denied || MX.getLastDeniedOpenid() || "",
        });
    },

    async handleLogin() {
        this.setData({ loading: true });
        try {
            const user = await MX.ensureLnnxLogin({ force: true });
            this.setData({
                code: "",
                loading: false,
                isLogin: true,
                user,
                openid: (user && user.openid) || "",
            });
            wx.showToast({ title: "登录成功", icon: "success" });
        } catch (err) {
            this.setData({
                loading: false,
                isLogin: false,
                user: null,
                openid: (err && err.openid) || MX.getLastDeniedOpenid() || "",
            });
            const tip = (err && err.message) || "登录失败";
            wx.showModal({
                title: "登录失败",
                content: this.data.openid ? `${tip}\nopenid: ${this.data.openid}` : tip,
                showCancel: false,
            });
        }
    },

    handleCopyOpenid() {
        const openid = this.data.openid;
        if (!openid) {
            wx.showToast({ title: "暂无 openid", icon: "none" });
            return;
        }
        wx.setClipboardData({
            data: openid,
            success: () => wx.showToast({ title: "已复制 openid", icon: "none" }),
        });
    },

    handleLogout() {
        MX.clearUser();
        this.refreshLocal();
        wx.showToast({ title: "已退出", icon: "none" });
    },
});
