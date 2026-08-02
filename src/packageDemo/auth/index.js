import MX from "@utils/index";

Page({
    data: {
        nickname: "",
        avatarUrl: "",
        phoneCode: "",
    },

    handleOpenSetting() {
        MX.openSetting().then((res) => {
            wx.showToast({ title: "已打开设置", icon: "none" });
            console.log(res.authSetting);
        });
    },

    handleLocationAuth() {
        MX.authorizeBatch(["scope.userLocation"], { openSettingOnFail: true }).then((r) => {
            wx.showToast({
                title: r["scope.userLocation"] ? "定位已授权" : "未授权",
                icon: "none",
            });
        });
    },

    onChooseAvatar(e) {
        const { avatarUrl } = e.detail || {};
        this.setData({ avatarUrl });
    },

    onNicknameChange(e) {
        this.setData({ nickname: e.detail.value });
    },

    onNicknameBlur(e) {
        this.setData({ nickname: e.detail.value });
    },

    onGetPhoneNumber(e) {
        const { code, errMsg } = e.detail || {};
        this.setData({ phoneCode: code || "" });
        wx.showToast({
            title: code ? "已获取手机号 code" : errMsg || "失败",
            icon: "none",
        });
    },

    handleProfile() {
        wx.showToast({
            title: "请使用头像/昵称填写能力",
            icon: "none",
        });
    },
});
