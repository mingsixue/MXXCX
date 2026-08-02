Page({
    data: {
        list: [],
        page: 1,
        pageSize: 10,
        total: 35,
        loading: false,
        finished: false,
    },

    onLoad() {
        this.reload();
    },

    onPullDownRefresh() {
        this.reload().finally(() => wx.stopPullDownRefresh());
    },

    onReachBottom() {
        this.loadMore();
    },

    mockFetch(page) {
        const { pageSize, total } = this.data;
        return new Promise((resolve) => {
            setTimeout(() => {
                const start = (page - 1) * pageSize;
                const rows = [];
                for (let i = 0; i < pageSize && start + i < total; i++) {
                    rows.push({
                        id: start + i + 1,
                        title: `列表项 ${start + i + 1}`,
                        desc: `更新时间 ${Date.now()}`,
                    });
                }
                resolve(rows);
            }, 400);
        });
    },

    async reload() {
        this.setData({ page: 1, finished: false, list: [] });
        await this.loadMore(true);
    },

    async loadMore(isReload) {
        if (this.data.loading || (this.data.finished && !isReload)) return;
        this.setData({ loading: true });
        const page = isReload ? 1 : this.data.page;
        const rows = await this.mockFetch(page);
        const list = isReload ? rows : this.data.list.concat(rows);
        this.setData({
            list,
            page: page + 1,
            loading: false,
            finished: list.length >= this.data.total,
        });
    },

    handleUpdateSecond() {
        const list = this.data.list.slice();
        if (!list[1]) {
            wx.showToast({ title: "请先加载至少 2 条", icon: "none" });
            return;
        }
        list[1] = {
            ...list[1],
            title: `已更新 ${list[1].id}`,
            desc: `单条更新 ${new Date().toLocaleTimeString()}`,
        };
        this.setData({ list });
    },

    handleClear() {
        this.setData({ list: [], finished: true, page: 1 });
    },
});
