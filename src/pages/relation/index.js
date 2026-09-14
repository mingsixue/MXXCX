import MX from "@utils/index";
import { ensureStaffPage } from "../tabbar/menus";
import { computeContentHeight } from "@utils/nameSearch";

function mapListItem(item) {
    const name = String(item.name || "").trim();
    return {
        ...item,
        nameInitial: name ? name.slice(0, 1) : "?",
        photo_urls: Array.isArray(item.photo_urls) ? item.photo_urls : [],
    };
}

Page({
    data: {
        contentHeight: 600,
        keyword: "",
        list: [],
        total: 0,
        page: 1,
        limit: 20,
        loading: false,
        loadingMore: false,
        hasMore: false,
        searched: false,
        empty: false,
        searchReady: true,
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
    },

    onPullDownRefresh() {
        if (!(this.data.searched || this.data.keyword.trim())) {
            wx.stopPullDownRefresh();
            return;
        }
        this.search(true).finally(() => wx.stopPullDownRefresh());
    },

    onReachBottom() {
        if (!this.data.hasMore || this.data.loadingMore || this.data.loading) return;
        this.setData({ page: this.data.page + 1 }, () => this.search(false));
    },

    handleSearchChange(e) {
        const { value = "", from } = e.detail || {};
        this.setData({ keyword: value });

        if (from === "clear") {
            this.clearResult();
        }
    },

    handleReset() {
        this.clearResult(true);
    },

    clearResult(remountSearch = false) {
        const next = {
            keyword: "",
            list: [],
            total: 0,
            empty: false,
            hasMore: false,
            page: 1,
            loading: false,
            loadingMore: false,
        };
        if (!remountSearch) {
            this.setData(next);
            return;
        }
        this.setData({ ...next, searchReady: false }, () => {
            this.setData({ searchReady: true });
        });
    },

    handleSearch() {
        if (!this.data.keyword.trim()) {
            wx.showToast({ title: "请输入姓名", icon: "none" });
            return;
        }
        this.search(true);
    },

    async search(reset = true) {
        const keyword = this.data.keyword.trim();
        if (!keyword && reset && !this.data.searched) {
            wx.showToast({ title: "请输入姓名", icon: "none" });
            return;
        }

        const page = reset ? 1 : this.data.page;
        this.setData({ loading: reset, loadingMore: !reset, searched: true });

        try {
            const params = { page, limit: this.data.limit };
            if (keyword) params.name = keyword;

            const data = await MX.get("relation/list", params);
            const rows = (Array.isArray(data?.list) ? data.list : []).map(mapListItem);
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
        MX.go(`/pages/relation/detail/index?id=${id}`);
    },

    handleAdd() {
        if (!this.data.canAdd) return;
        MX.go("/pages/relation/form/index");
    },
});
