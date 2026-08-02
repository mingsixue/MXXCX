import MX from "@utils/index";

Page({
    handleReport() {
        MX.report.report({ type: "custom", message: "manual report demo" }).then(() => {
            wx.showToast({ title: "已上报(见控制台)", icon: "none" });
        });
    },
    handleError() {
        try {
            throw new Error("demo error");
        } catch (e) {
            MX.report.captureError(e, { source: "packageDemo/report" });
            wx.showToast({ title: "错误已捕获", icon: "none" });
        }
    },
});
