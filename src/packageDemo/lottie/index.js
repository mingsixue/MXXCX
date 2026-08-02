Page({
    data: {
        tip: "请先在工程根目录 yarn 安装依赖，再 yarn start；构建会自动同步 miniprogram_npm。",
    },

    onReady() {
        // 示例：业务侧可在此获取 canvas 节点后调用 MX.lottie.play
    },

    handleInfo() {
        wx.showModal({
            title: "Lottie",
            content: this.data.tip,
            showCancel: false,
        });
    },
});
