import config from "../../config/config";

Page({
    data: {
        version: "",
    },

    onLoad() {
        this.setData({
            version: config.VERSION || "",
        });
    },

    handleItem(e) {
        wx.showToast({ title: e.currentTarget.dataset.name, icon: "none" });
    },
});
