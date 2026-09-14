import MX from "@utils/index";
import { computeContentHeight } from "@utils/nameSearch";

function mapCategoryTabs(categories) {
    const tabs = [{ value: 0, label: "全部" }];
    (categories || [])
        .filter((item) => Number(item.parent_id) === 0)
        .forEach((item) => {
            tabs.push({
                value: Number(item.id) || 0,
                label: item.name || item.display_name || "",
            });
        });
    return tabs;
}

Page({
    data: {
        contentHeight: 600,
        listHeight: 500,
        typeTabs: [{ value: 0, label: "全部" }],
        keyword: "",
        type: 0,
        selectedTypeLabel: "全部",
        list: [],
        total: 0,
        page: 1,
        limit: 20,
        loading: false,
        loadingMore: false,
        hasMore: false,
        searched: false,
        empty: false,
    },

    onLoad() {
        const contentHeight = computeContentHeight();
        this.setData({
            contentHeight,
            listHeight: Math.max(contentHeight - 110, 400),
        });
        this.loadCategories().finally(() => this.search(true));
    },

    onShow() {
        wx.setNavigationBarColor({
            frontColor: "#000000",
            backgroundColor: "#ffffff",
        });
    },

    onPullDownRefresh() {
        this.search(true).finally(() => wx.stopPullDownRefresh());
    },

    onReachBottom() {
        if (!this.data.hasMore || this.data.loadingMore || this.data.loading) return;
        this.setData({ page: this.data.page + 1 }, () => this.search(false));
    },

    async loadCategories() {
        try {
            const rows = await MX.get("clothes/categories");
            const typeTabs = mapCategoryTabs(Array.isArray(rows) ? rows : []);
            this.setData({ typeTabs });
        } catch (e) {
            this.setData({ typeTabs: [{ value: 0, label: "全部" }] });
        }
    },

    handleKeywordInput(e) {
        this.setData({ keyword: e.detail.value || "" });
    },

    handleClearKeyword() {
        this.setData({ keyword: "" }, () => this.search(true));
    },

    handleSearch() {
        this.search(true);
    },

    handleTypeTap(e) {
        const type = Number(e.currentTarget.dataset.value);
        const selectedTypeLabel = e.currentTarget.dataset.label || "全部";
        if (type === this.data.type) return;
        this.setData({ type, selectedTypeLabel }, () => this.search(true));
    },

    handleLoadMore() {
        if (!this.data.hasMore || this.data.loadingMore || this.data.loading) return;
        this.setData({ page: this.data.page + 1 }, () => this.search(false));
    },

    async search(reset = true) {
        const keyword = this.data.keyword.trim();
        const page = reset ? 1 : this.data.page;
        this.setData({ loading: reset, loadingMore: !reset, searched: true });

        try {
            const params = { page, limit: this.data.limit };
            if (keyword) params.name = keyword;
            if (this.data.type > 0) params.type = this.data.type;

            const data = await MX.get("clothes/list", params);
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
                loading: false,
                loadingMore: false,
                empty: reset ? true : this.data.empty,
                list: reset ? [] : this.data.list,
            });
        }
    },

    handleDetail(e) {
        const { id } = e.currentTarget.dataset;
        if (!id) return;
        MX.go(`/pages/clothes/detail/index?id=${id}`);
    },
});
