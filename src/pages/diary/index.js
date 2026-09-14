import MX from "@utils/index";
import { ensureStaffPage } from "../tabbar/menus";
import { computeContentHeight } from "@utils/nameSearch";

Page({
    data: {
        contentHeight: 600,
        keyword: "",
        day: "",
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
        popupVisible: false,
        popupLoading: false,
        popupDetail: null,
        popupTags: [],
        today: "",
        canAdd: false,
    },

    onLoad() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        this.setData({
            contentHeight: computeContentHeight(),
            today: `${y}-${m}-${d}`,
        });
    },

    async onShow() {
        const ok = await ensureStaffPage();
        if (!ok) return;
        wx.setNavigationBarColor({
            frontColor: "#000000",
            backgroundColor: "#ffffff",
        });
        this.setData({ canAdd: MX.canAddOwned() });
    },

    onPullDownRefresh() {
        if (!this.data.searched) {
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
            // 仅清关键字，日期保留
        }
    },

    handleNativeDayChange(e) {
        this.setData({ day: (e.detail && e.detail.value) || "" });
    },

    handleClearDay() {
        this.setData({ day: "" });
    },

    handleReset() {
        this.setData(
            {
                keyword: "",
                day: "",
                list: [],
                total: 0,
                empty: false,
                hasMore: false,
                page: 1,
                loading: false,
                loadingMore: false,
                searched: false,
                searchReady: false,
            },
            () => {
                this.setData({ searchReady: true });
            }
        );
    },

    handleSearch() {
        const keyword = this.data.keyword.trim();
        const day = this.data.day;
        if (!keyword && !day) {
            wx.showToast({ title: "请选择日期或输入关键字", icon: "none" });
            return;
        }
        this.search(true);
    },

    async search(reset = true) {
        const keyword = this.data.keyword.trim();
        const day = this.data.day;
        if (!keyword && !day) {
            if (reset) {
                wx.showToast({ title: "请选择日期或输入关键字", icon: "none" });
            }
            return;
        }

        const page = reset ? 1 : this.data.page;
        this.setData({ loading: reset, loadingMore: !reset, searched: true });

        try {
            const params = { page, limit: this.data.limit };
            if (keyword) params.keyword = keyword;
            if (day) params.day = day;

            const data = await MX.get("diary/list", params);
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
        this.openDetail(Number(id));
    },

    async openDetail(id) {
        this.setData({
            popupVisible: true,
            popupLoading: true,
            popupDetail: null,
            popupTags: [],
        });
        try {
            const detail = await MX.get("diary/detail", { id });
            if (!detail || !detail.id) {
                this.setData({ popupLoading: false, popupDetail: null });
                wx.showToast({ title: "未找到该日记", icon: "none" });
                return;
            }
            this.setData({
                popupDetail: detail,
                popupTags: Array.isArray(detail.tags) ? detail.tags : [],
                popupLoading: false,
            });
        } catch (e) {
            this.setData({ popupLoading: false, popupDetail: null });
        }
    },

    handlePopupClose() {
        this.setData({
            popupVisible: false,
            popupLoading: false,
            popupDetail: null,
            popupTags: [],
        });
    },

    handleAdd() {
        if (!this.data.canAdd) return;
        MX.go("/pages/diary/form/index");
    },
});
