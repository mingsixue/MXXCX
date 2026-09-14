import MX from "@utils/index";
import { computeContentHeight, formatDateSlash, getExpiryStatus, pushField } from "@utils/nameSearch";

function mapStatusState(status) {
    const value = Number(status) || 0;
    if (value === 1) return "normal";
    if (value === 2) return "expired";
    if (value === 3) return "discarded";
    if (value === 4) return "used";
    return "";
}

function buildSections(detail) {
    if (!detail) return [];
    const basic = [];
    pushField(basic, "名称", detail.name);
    pushField(basic, "分类", detail.type_text);
    pushField(basic, "保存", detail.save_way_text);

    const time = [];
    pushField(time, "购买时间", formatDateSlash(detail.buy_date));
    pushField(time, "过期时间", formatDateSlash(detail.expires_time));
    pushField(time, "剩余天数", detail.remainingText);

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
        photoUrls: [],
        title: "食品详情",
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
            const detail = await MX.get("food/detail", { id });
            if (!detail || !detail.id) {
                this.setData({ loading: false, empty: true, detail: null, sections: [], photoUrls: [] });
                return;
            }
            const displayDetail = {
                ...detail,
                ...getExpiryStatus(detail.expires_time),
                statusState: mapStatusState(detail.status),
            };
            this.setData({
                detail: displayDetail,
                sections: buildSections(displayDetail),
                photoUrls: Array.isArray(detail.photo_urls) ? detail.photo_urls : [],
                title: detail.name || "食品详情",
                canWrite: (await MX.waitLnnxReady(), MX.canWriteRecord(detail)),
                loading: false,
                empty: false,
            });
        } catch (e) {
            this.setData({ loading: false, empty: true, detail: null, sections: [], canWrite: false });
        }
    },

    handlePreviewPhoto(e) {
        const { url } = e.currentTarget.dataset;
        if (!url) return;
        wx.previewImage({ current: url, urls: this.data.photoUrls });
    },

    handleEdit() {
        if (!this.data.id || !this.data.canWrite) return;
        MX.go(`/pages/food/form/index?id=${this.data.id}`);
    },

    handleDelete() {
        if (!this.data.id || !this.data.canWrite || this._deleting) return;
        const name = (this.data.detail && this.data.detail.name) || "";
        wx.showModal({
            title: "确认删除",
            content: name ? `确定删除食品「${name}」吗？` : "确定删除该食品吗？",
            confirmColor: "#a25248",
            success: async (res) => {
                if (!res.confirm) return;
                this._deleting = true;
                try {
                    await MX.get("food/del", { id: this.data.id });
                    wx.showToast({ title: "已删除", icon: "success" });
                    setTimeout(() => MX.back(), 400);
                } catch (e) {
                    // request 已提示
                } finally {
                    this._deleting = false;
                }
            },
        });
    },
});
