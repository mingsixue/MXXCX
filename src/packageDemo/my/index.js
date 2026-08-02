import MX from "@utils/index";
Page({
    data: { isLogin: false, user: {} },
    onShow() {
        this.setData({ isLogin: MX.getIsLogin(), user: MX.getUserInfo() });
    },
    handleLogin() {
        MX.go("/packageDemo/login/index");
    },
    handleSetting() {
        MX.go("/packageDemo/setting/index");
    },
});
