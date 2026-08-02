import MX from "@utils/index";

const COVERS = [
    "https://img.yzcdn.cn/vant/apple-1.jpg",
    "https://img.yzcdn.cn/vant/apple-2.jpg",
    "https://img.yzcdn.cn/vant/apple-3.jpg",
];

Page({
    data: {
        list: [],
        page: 1,
        pageSize: 6,
        total: 18,
        loading: false,
        finished: false,
        shareVisible: false,
        shareImage: COVERS[0],
    },

    onLoad() {
        wx.showShareMenu({
            withShareTicket: true,
            menus: ["shareAppMessage"],
        });
        this.reload();
    },

    onShareAppMessage() {
        const { shareImage } = this.data;
        return {
            title: "精选商品列表",
            path: "/packageDemo/goods-list/index",
            imageUrl: shareImage,
        };
    },

    openShare() {
        const first = this.data.list[0];
        this.setData({
            shareVisible: true,
            shareImage: (first && first.cover) || COVERS[0],
        });
    },

    onShareClose() {
        this.setData({ shareVisible: false });
    },

    onShareWechat() {
        this.setData({ shareVisible: false });
    },

    onCopyLink() {
        wx.setClipboardData({
            data: "/packageDemo/goods-list/index",
            success: () => {
                wx.showToast({ title: "链接已复制", icon: "none" });
            },
        });
        this.setData({ shareVisible: false });
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
                    const id = start + i + 1;
                    rows.push({
                        id,
                        cover: COVERS[id % COVERS.length],
                        title: `示例商品 ${id} · 轻便百搭日常款`,
                        label: id % 3 === 1 ? "热卖" : "",
                        price: 69 + (id % 5) * 10,
                        originPrice: `¥${129 + (id % 5) * 10}`,
                        tags: [{ text: "包邮" }, { text: id % 2 ? "新品" : "满减" }],
                        btnText: "立即购买",
                    });
                }
                resolve(rows);
            }, 350);
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

    onItemTap(e) {
        const { index } = e.detail || {};
        const item = this.data.list[index];
        if (!item) return;
        MX.go(`/packageDemo/goods/index?id=${item.id}`);
    },

    onBuyTap(e) {
        const { index } = e.detail || {};
        const item = this.data.list[index];
        wx.showToast({
            title: item ? `购买 ${item.title}` : "购买",
            icon: "none",
        });
    },
});
