import MX from "@utils/index";
import { ensureStaffPage } from "../tabbar/menus";
import { computeContentHeight } from "@utils/nameSearch";

const SCOPES = [
    { value: "soon", label: "即将到期" },
    { value: "expired", label: "已过期" },
    { value: "all", label: "全部" },
];

Page({
    data: {
        contentHeight: 600,
        scopes: SCOPES,
        scope: "soon",
        selectedScopeLabel: "即将到期",
        list: [],
        total: 0,
        page: 1,
        limit: 20,
        loading: true,
        loadingMore: false,
        hasMore: false,
        empty: false,
        canAdd: false,
    },

    onLoad() {
        this.setData({ contentHeight: computeContentHeight() });
    },

    async onShow() {
        const ok = await ensureStaffPage();
        if (!ok) return;
        wx.setNavigationBarColor({
            frontColor: "#000000",
            backgroundColor: "#ffffff",
        });
        this.setData({ canAdd: MX.canAddShared() });
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
            const data = await MX.get("renewal/list", {
                page,
                limit: this.data.limit,
                scope: this.data.scope,
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
        const scope = e.currentTarget.dataset.value || "soon";
        const selectedScopeLabel = e.currentTarget.dataset.label || "即将到期";
        if (scope === this.data.scope) return;
        this.setData({ scope, selectedScopeLabel }, () => this.loadList(true));
    },

    handleDetail(e) {
        const { id } = e.currentTarget.dataset;
        if (!id) return;
        MX.go(`/pages/renewal/detail/index?id=${id}`);
    },

    handleAdd() {
        if (!this.data.canAdd) return;
        MX.go("/pages/renewal/form/index");
    },
});
