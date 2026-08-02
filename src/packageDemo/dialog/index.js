Page({
    data: {
        confirmVisible: false,
        dialogVisible: false,
        protocolVisible: false,
    },

    handleAlert() {
        wx.showModal({
            title: "警告",
            content: "这是一个警告框示例",
            showCancel: false,
        });
    },

    openConfirm() {
        this.setData({ confirmVisible: true });
    },

    onConfirmCancel() {
        this.setData({ confirmVisible: false });
    },

    onConfirmOk() {
        this.setData({ confirmVisible: false });
        wx.showToast({ title: "已确认", icon: "none" });
    },

    openDialog() {
        this.setData({ dialogVisible: true });
    },

    onDialogClose() {
        this.setData({ dialogVisible: false });
    },

    onDialogConfirm() {
        this.setData({ dialogVisible: false });
    },

    openProtocol() {
        this.setData({ protocolVisible: true });
    },

    onProtocolClose() {
        this.setData({ protocolVisible: false });
    },
});
