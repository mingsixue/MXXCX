import MX from "@utils/index";

Page({
    data: { safe: {}, statusBarHeight: 0 },
    onLoad() {
        this.setData({
            safe: MX.getSafeArea(),
            statusBarHeight: MX.getStatusBarHeight(),
        });
    },
});
