import MX from "@utils/index";
import { computeContentHeight, formatDateSlash, getExpiryStatus, mapTypeTabs } from "@utils/nameSearch";

const TYPE_TEXT = {
    1: "发烧疼痛",
    2: "感冒咳嗽",
    3: "肠胃药",
    4: "抗过敏药",
    5: "外用药",
    6: "五官用药",
    7: "慢病药",
    8: "儿童药品",
    9: "中成药",
    10: "消毒用品",
    11: "维生素",
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

            const data = await MX.get("medication/list", params);
            const rows = Array.isArray(data?.list)
                ? data.list.map((item) => ({
                      ...item,
                      ...getExpiryStatus(item.expire_date),
                      expire_date: formatDateSlash(item.expire_date),
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
        MX.go(`/pages/medication/detail/index?id=${id}`);
    },
});
