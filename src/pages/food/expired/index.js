import MX from "@utils/index";
import { computeContentHeight, formatDateSlash, getExpiryStatus } from "@utils/nameSearch";

Page({
    data: {
        contentHeight: 600,
        scopes: [
            { value: "expired", label: "已过期" },
            { value: "7", label: "7天内过期" },
            { value: "30", label: "30天内过期" },
        ],
        scope: "expired",
        selectedScopeLabel: "已过期",
        list: [],
        total: 0,
        page: 1,
        limit: 20,
        loading: true,
        loadingMore: false,
        hasMore: false,
        empty: false,
    },

    onLoad() {
        this.setData({ contentHeight: computeContentHeight() });
        this.loadList(true);
    },

    onPullDownRefresh() {
        this.loadList(true).finally(() => wx.stopPullDownRefresh());
    },

    onReachBottom() {
        if (!this.data.hasMore || this.data.loading || this.data.loadingMore) return;
        this.setData({ page: this.data.page + 1 }, () => this.loadList(false));
    },

    async loadList(reset = true) {
        const page = reset ? 1 : this.data.page;
        this.setData({ loading: reset, loadingMore: !reset });
        try {
            const data = await MX.get("food/expired", {
                page,
                limit: this.data.limit,
                scope: this.data.scope,
            });
            const rows = Array.isArray(data?.list)
                ? data.list.map((item) => ({
                      ...item,
                      ...getExpiryStatus(item.expires_time),
                      expires_time: formatDateSlash(item.expires_time),
                  }))
                : [];
            const total = Number(data?.total) || 0;
            const list = reset ? rows : this.data.list.concat(rows);
            this.setData({
                list,
                total,
                page,
                hasMore: list.length < total,
                empty: list.length === 0,
                loading: false,
                loadingMore: false,
            });
        } catch (e) {
            this.setData({
                list: reset ? [] : this.data.list,
                empty: reset,
                loading: false,
                loadingMore: false,
            });
        }
    },

    handleScopeTap(e) {
        const scope = e.currentTarget.dataset.value || "expired";
        const selectedScopeLabel = e.currentTarget.dataset.label || "已过期";
        if (scope === this.data.scope) return;
        this.setData({ scope, selectedScopeLabel }, () => this.loadList(true));
    },

    handleDetail(e) {
        const { id } = e.currentTarget.dataset;
        if (!id) return;
        MX.go(`/pages/food/detail/index?id=${id}`);
    },
});
