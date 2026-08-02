import MX from "@utils/index";

Page({
    data: {
        code: "",
        loading: false,
    },

    handleLogin() {
        this.setData({ loading: true });
        wx.login({
            success: (res) => {
                this.setData({ code: res.code || "", loading: false });
                // 业务侧拿 code 换 session / token
                // MX.post('/api/login', { code: res.code })
                wx.showToast({ title: "已获取 code", icon: "none" });
            },
            fail: () => {
                this.setData({ loading: false });
                wx.showToast({ title: "wx.login 失败", icon: "none" });
            },
        });
    },

    handleMockLogin() {
        MX.setUserAllInfo({
            id: "demo-user",
            token: "demo-token",
            nickName: "Demo",
        });
        wx.showToast({ title: "已写入本地登录态", icon: "none" });
    },

    handleLogout() {
        MX.clearUser();
        wx.showToast({ title: "已退出", icon: "none" });
    },
});
