Page({
    data: { loading: true },
    onLoad() {
        setTimeout(() => this.setData({ loading: false }), 1500);
    },
    handleReload() {
        this.setData({ loading: true });
        setTimeout(() => this.setData({ loading: false }), 1500);
    },
});
