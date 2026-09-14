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
    pushField(basic, "名称", detail.name);
    pushField(basic, "分类", detail.type_text);
    pushCompactField(basic, "季节", detail.season_text);
    pushCompactField(basic, "适用", detail.applicable_text);
    pushCompactField(basic, "归属", detail.affiliation_name);
    pushCompactField(basic, "状态", detail.status_text);
    pushCompactField(basic, "情侣装", detail.is_lovers_text);

    const feature = [];
    pushField(feature, "面料", detail.fabric);
    pushField(feature, "颜色", detail.color);
    pushField(feature, "来源", detail.source);
    pushField(feature, "位置", detail.location);

    const buy = [];
    pushField(buy, "购买时间", detail.buy_date);
    pushField(buy, "购买价格", detail.buy_price ? `¥${detail.buy_price}` : "");

    const other = [];
    pushField(other, "备注", detail.remark, { multiline: true });

    return [
        { key: "basic", title: "基本信息", rows: basic },
        { key: "feature", title: "衣物特征", rows: feature },
        { key: "buy", title: "购买信息", rows: buy },
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
        relatedItems: [],
        title: "衣物详情",
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
            const detail = await MX.get("clothes/detail", { id });
            if (!detail || !detail.id) {
                this.setData({
                    loading: false,
                    empty: true,
                    detail: null,
                    sections: [],
                    photoUrls: [],
                    relatedItems: [],
                });
                return;
            }
            this.setData({
                detail,
                sections: buildSections(detail),
                photoUrls: Array.isArray(detail.photo_urls) ? detail.photo_urls : [],
                relatedItems: Array.isArray(detail.related_items) ? detail.related_items : [],
                title: detail.name || "衣物详情",
                canWrite: (await MX.waitLnnxReady(), MX.canWriteRecord(detail)),
                loading: false,
                empty: false,
            });
        } catch (e) {
            this.setData({
                loading: false,
                empty: true,
                detail: null,
                sections: [],
                relatedItems: [],
                canWrite: false,
            });
        }
    },

    handlePreviewPhoto(e) {
        const { url } = e.currentTarget.dataset;
        if (!url) return;
        wx.previewImage({ current: url, urls: this.data.photoUrls });
    },

    handleRelated(e) {
        const { id } = e.currentTarget.dataset;
        if (!id || id === this.data.id) return;
        MX.go(`/pages/clothes/detail/index?id=${id}`);
    },

    handleEdit() {
        if (!this.data.id || !this.data.canWrite) return;
        MX.go(`/pages/clothes/form/index?id=${this.data.id}`);
    },

    handleDelete() {
        if (!this.data.id || !this.data.canWrite || this._deleting) return;
        const name = (this.data.detail && this.data.detail.name) || "";
        wx.showModal({
            title: "确认删除",
            content: name ? `确定删除衣物「${name}」吗？` : "确定删除该衣物吗？",
            confirmColor: "#a25248",
            success: async (res) => {
                if (!res.confirm) return;
                this._deleting = true;
                try {
                    await MX.get("clothes/del", { id: this.data.id });
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
