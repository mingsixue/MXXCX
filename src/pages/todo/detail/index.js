import MX from "@utils/index";
import { computeContentHeight, pushField } from "@utils/nameSearch";
import { buildCountdown, formatDateSecond } from "@utils/todoCountdown";

function pushCompactField(rows, label, value) {
    const previousLength = rows.length;
    pushField(rows, label, value);
    if (rows.length > previousLength) {
        rows[rows.length - 1].compact = true;
    }
}

const PRIORITY_CLASS = {
    1: "low",
    2: "mid",
    3: "high",
    4: "urgent",
};

function buildSections(detail) {
    if (!detail) return [];
    const basic = [];
    pushField(basic, "标题", detail.title);
    pushField(basic, "内容", detail.content, { multiline: true });
    pushCompactField(basic, "分类", detail.type_text);
    pushCompactField(basic, "优先级", detail.priority_text);
    pushCompactField(basic, "状态", detail.status_text);
    pushCompactField(basic, "归属", detail.affiliation_name);
    pushField(basic, "负责人", detail.assignee);

    const time = [];
    pushField(time, "计划开始", formatDateSecond(detail.plan_start_time));
    pushField(time, "计划完成", formatDateSecond(detail.plan_end_time));
    pushField(time, "实际完成", formatDateSecond(detail.done_time));

    const other = [];
    pushField(other, "备注", detail.remark, { multiline: true });
    pushField(other, "创建时间", formatDateSecond(detail.create_time));
    pushField(other, "更新时间", formatDateSecond(detail.update_time));

    return [
        { key: "basic", title: "基本信息", rows: basic },
        { key: "time", title: "时间信息", rows: time },
        { key: "other", title: "其他", rows: other },
    ].filter((s) => s.rows.length > 0);
}

Page({
    data: {
        contentHeight: 600,
        id: 0,
        loading: true,
        empty: false,
        detail: null,
        sections: [],
        title: "待办详情",
        canDone: false,
        priorityClass: "low",
        countdownText: "",
        countdownState: "",
        canWrite: false,
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
        if (this._hasShown && this.data.id) {
            this.loadDetail(this.data.id);
        }
        this._hasShown = true;
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
            const detail = await MX.get("todo/detail", { id });
            if (!detail || !detail.id) {
                this.setData({
                    loading: false,
                    empty: true,
                    detail: null,
                    sections: [],
                    canDone: false,
                    countdownText: "",
                    countdownState: "",
                });
                return;
            }
            const status = Number(detail.status);
            const countdown = buildCountdown(detail.plan_end_time, status);
            await MX.waitLnnxReady();
            const canWrite = MX.canWriteRecord(detail);
            this.setData({
                detail,
                sections: buildSections(detail),
                title: detail.title || "待办详情",
                canDone: canWrite && (status === 1 || status === 2),
                canWrite,
                priorityClass: PRIORITY_CLASS[Number(detail.priority)] || "low",
                countdownText: countdown.countdownText,
                countdownState: countdown.countdownState,
                loading: false,
                empty: false,
            });
        } catch (e) {
            this.setData({
                loading: false,
                empty: true,
                detail: null,
                sections: [],
                canDone: false,
                canWrite: false,
                priorityClass: "low",
                countdownText: "",
                countdownState: "",
            });
        }
    },

    handleEdit() {
        if (!this.data.id || !this.data.canWrite) return;
        MX.go(`/pages/todo/form/index?id=${this.data.id}`);
    },

    handleDone() {
        if (!this.data.id || !this.data.canWrite || !this.data.canDone) return;
        wx.showModal({
            title: "确认完成",
            content: `确定将「${this.data.detail?.title || "该待办"}」标记为已完成？`,
            success: async (res) => {
                if (!res.confirm) return;
                try {
                    await MX.post("todo/status", { id: this.data.id, status: 3 });
                    wx.showToast({ title: "已完成", icon: "success" });
                    this.loadDetail(this.data.id);
                } catch (e) {
                    // request 已提示
                }
            },
        });
    },

    handleDelete() {
        if (!this.data.id || !this.data.canWrite) return;
        wx.showModal({
            title: "确认删除",
            content: `确定删除待办「${this.data.detail?.title || ""}」吗？`,
            confirmColor: "#a25248",
            success: async (res) => {
                if (!res.confirm) return;
                try {
                    await MX.get("todo/del", { id: this.data.id });
                    wx.showToast({ title: "已删除", icon: "success" });
                    setTimeout(() => MX.back(), 400);
                } catch (e) {
                    // request 已提示
                }
            },
        });
    },
});
