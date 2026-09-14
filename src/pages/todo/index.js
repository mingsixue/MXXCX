import MX from "@utils/index";
import { ensureStaffPage } from "../tabbar/menus";
import { computeContentHeight } from "@utils/nameSearch";
import { buildCountdown, formatDateMinute } from "@utils/todoCountdown";

const STATUS_TABS = [
    { value: "active", label: "进行中" },
    { value: "1", label: "待处理" },
    { value: "2", label: "处理中" },
    { value: "3", label: "已完成" },
    { value: "0", label: "全部" },
];

const PRIORITY_CLASS = {
    1: "low",
    2: "mid",
    3: "high",
    4: "urgent",
};

function mapItem(item) {
    const status = Number(item.status);
    const countdown = buildCountdown(item.plan_end_time, status);
    return {
        ...item,
        isDone: status === 3,
        priorityClass: PRIORITY_CLASS[Number(item.priority)] || "low",
        planEndDisplay: formatDateMinute(item.plan_end_time),
        countdownText: countdown.countdownText,
        countdownState: countdown.countdownState,
    };
}

Page({
    data: {
        contentHeight: 600,
        scopes: STATUS_TABS,
        scope: "active",
        selectedScopeLabel: "进行中",
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
        this.setData({ canAdd: MX.canAddOwned() });
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
            const params = { page, limit: this.data.limit };
            const { scope } = this.data;
            if (scope === "active") {
                params.status = "active";
            } else if (scope !== "0" && scope !== "") {
                params.status = Number(scope);
            }

            const data = await MX.get("todo/list", params);
            const rows = (Array.isArray(data?.list) ? data.list : []).map(mapItem);
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
        const scope = e.currentTarget.dataset.value || "active";
        const selectedScopeLabel = e.currentTarget.dataset.label || "进行中";
        if (scope === this.data.scope) return;
        this.setData({ scope, selectedScopeLabel }, () => this.loadList(true));
    },

    handleDetail(e) {
        const { id } = e.currentTarget.dataset;
        if (!id) return;
        MX.go(`/pages/todo/detail/index?id=${id}`);
    },

    handleAdd() {
        if (!this.data.canAdd) return;
        MX.go("/pages/todo/form/index");
    },
});
