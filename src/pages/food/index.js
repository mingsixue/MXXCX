import MX from "@utils/index";
import { computeContentHeight, getExpiryStatus, mapTypeTabs } from "@utils/nameSearch";

const TYPE_TEXT = {
    1: "畜/禽/肉/蛋",
    2: "粮/油/米/面",
    3: "海鲜/水产品",
    4: "奶制品",
    5: "蔬菜",
    6: "水果",
    7: "饮料/茶/咖啡",
    8: "发酵食品",
    9: "调料品",
    10: "零食",
    11: "干货",
    12: "干果",
    13: "方便食品",
    14: "罐头",
    15: "酒类",
    16: "其他",
};

Page({
    data: {
        contentHeight: 600,
        listHeight: 500,
        typeTabs: mapTypeTabs(TYPE_TEXT),
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
        }, () => this.search(true));
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

            const data = await MX.get("food/list", params);
            const rows = Array.isArray(data?.list)
                ? data.list.map((item) => ({
                      ...item,
                      ...getExpiryStatus(item.expires_time),
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
        MX.go(`/pages/food/detail/index?id=${id}`);
    },
});
