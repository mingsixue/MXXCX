import MX from "@utils/index";

Page({
    data: {
        url: "",
        messages: [],
    },

    onLoad(query) {
        let url = query.url ? decodeURIComponent(query.url) : "";
        if (!url) {
            // 默认示例页；业务可传入完整 https 地址
            url = "https://mp.weixin.qq.com/";
        }
        this.setData({ url });
    },

    onMessage(e) {
        const data = (e.detail && e.detail.data) || [];
        this.setData({ messages: data });
        console.log("webview message", data);
    },

    handleOpenDemo() {
        MX.openWebview("https://mp.weixin.qq.com/");
    },
});
