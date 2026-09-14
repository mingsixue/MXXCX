import MX from "@utils/index";
import { computeContentHeight, pushField } from "@utils/nameSearch";

function pushCompactField(rows, label, value) {
    const previousLength = rows.length;
    pushField(rows, label, value);
    if (rows.length > previousLength) {
        rows[rows.length - 1].compact = true;
    }
}

function buildSections(detail) {
    if (!detail) return [];
    const basic = [];
    pushField(basic, "事项名称", detail.name);
    pushField(basic, "归属", detail.affiliation_name);
    pushCompactField(basic, "续费周期", detail.cycle);
    pushCompactField(basic, "预计价格", detail.price !== "" && detail.price != null ? `¥${detail.price}` : "");
    pushCompactField(basic, "是否续费", detail.is_renewal_text);

    const time = [];
    pushField(time, "到期时间", detail.end_time);
    pushField(time, "剩余天数", detail.remaining_text);

    const other = [];
    pushField(other, "备注", detail.remark, { multiline: true });

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
        title: "续费详情",
        remainingClass: "",
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
            const detail = await MX.get("renewal/detail", { id });
            if (!detail || !detail.id) {
                this.setData({ loading: false, empty: true, detail: null, sections: [] });
                return;
            }
            this.setData({
                detail,
                sections: buildSections(detail),
                title: detail.name || "续费详情",
                remainingClass: detail.remaining_state || "",
                canWrite: (await MX.waitLnnxReady(), MX.canWriteRecord(detail)),
                loading: false,
                empty: false,
            });
        } catch (e) {
            this.setData({ loading: false, empty: true, detail: null, sections: [], canWrite: false });
        }
    },

    handleEdit() {
        if (!this.data.id || !this.data.canWrite) return;
        MX.go(`/pages/renewal/form/index?id=${this.data.id}`);
    },

    handleDelete() {
        if (!this.data.id || !this.data.canWrite) return;
        wx.showModal({
            title: "确认删除",
            content: `确定删除续费事项「${this.data.detail?.name || ""}」吗？`,
            confirmColor: "#a25248",
            success: async (res) => {
                if (!res.confirm) return;
                try {
                    await MX.get("renewal/del", { id: this.data.id });
                    wx.showToast({ title: "已删除", icon: "success" });
                    setTimeout(() => MX.back(), 400);
                } catch (e) {
                    // request 已提示
                }
            },
        });
    },
});
