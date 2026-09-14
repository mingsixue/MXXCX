import MX from "@utils/index";
import { computeContentHeight } from "@utils/nameSearch";

Page({
    data: {
        contentHeight: 600,
        scopes: [
            { value: 1, label: "敏" },
            { value: 2, label: "娟" },
        ],
        scope: 1,
        selectedScopeLabel: "敏",
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
            const data = await MX.get("clothes/list", {
                page,
                limit: this.data.limit,
                affiliation: this.data.scope,
            });
            const rows = Array.isArray(data?.list) ? data.list : [];
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
        const scope = Number(e.currentTarget.dataset.value) || 1;
        const selectedScopeLabel = e.currentTarget.dataset.label || "敏";
        if (scope === this.data.scope) return;
        this.setData({ scope, selectedScopeLabel }, () => this.loadList(true));
    },

    handleDetail(e) {
        const { id } = e.currentTarget.dataset;
        if (!id) return;
        MX.go(`/pages/clothes/detail/index?id=${id}`);
    },
});
