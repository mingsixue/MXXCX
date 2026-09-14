import MX from "@utils/index";
import { computeContentHeight } from "@utils/nameSearch";

Page({
    data: {
        contentHeight: 600,
        id: 0,
        loading: true,
        empty: false,
        detail: null,
        title: "日记详情",
        tags: [],
    },

    onLoad(options) {
        this.setData({ contentHeight: computeContentHeight() });
        const id = Number(options.id || 0);
        if (!id) {
            this.setData({ loading: false, empty: true });
            return;
        }
        this.setData({ id });
        this.loadDetail(id);
    },

    onShow() {
        wx.setNavigationBarColor({
            frontColor: "#000000",
            backgroundColor: "#ffffff",
        });
    },

    onPullDownRefresh() {
        if (!this.data.id) {
            wx.stopPullDownRefresh();
            return;
        }
        this.loadDetail(this.data.id).finally(() => wx.stopPullDownRefresh());
    },

    async loadDetail(id) {
        this.setData({ loading: true });
        try {
            const detail = await MX.get("diary/detail", { id });
            if (!detail || !detail.id) {
                this.setData({ loading: false, empty: true, detail: null, tags: [] });
                return;
            }
            this.setData({
                detail,
                tags: Array.isArray(detail.tags) ? detail.tags : [],
                title: detail.day || "日记详情",
                loading: false,
                empty: false,
            });
        } catch (e) {
            this.setData({ loading: false, empty: true, detail: null, tags: [] });
        }
    },
});
