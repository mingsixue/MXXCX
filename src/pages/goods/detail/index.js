import MX from "@utils/index";
import { computeContentHeight, pushField } from "@utils/nameSearch";

function pushCompactField(rows, label, value) {
    const previousLength = rows.length;
    pushField(rows, label, value);
    if (rows.length > previousLength) {
        rows[rows.length - 1].compact = true;
    }
}

function buildPathOptions(path) {
    if (!Array.isArray(path)) return [];
    return path.map((item, index) => ({
        id: Number(item.id) || 0,
        name: item.name || "",
        label: path
            .slice(0, index + 1)
            .map((row) => row.name)
            .filter(Boolean)
            .join(" / "),
    })).filter((item) => item.id && item.name);
}

function buildSections(detail) {
    if (!detail) return [];
    const basic = [];
    pushField(basic, "名称", detail.name);
    if (detail.category_name) {
        basic.push({
            key: "category",
            label: "分类",
            value: detail.category_name,
            linkMode: "category",
            linkId: detail.category_id || 0,
            pathOptions: buildPathOptions(detail.category_path),
        });
    }
    if (detail.storage_name) {
        basic.push({
            key: "storage",
            label: "位置",
            value: detail.storage_name,
            schematicUrl: detail.storage_schematic_url || "",
            linkMode: "storage",
            linkId: detail.storage_id || 0,
            pathOptions: buildPathOptions(detail.storage_path),
        });
    }
    pushCompactField(basic, "归属", detail.affiliation_name);
    pushCompactField(basic, "状态", detail.status_text);
    pushCompactField(basic, "频率", detail.is_frequency_text);
    pushCompactField(basic, "季节", detail.season_text);
    pushCompactField(basic, "特性", detail.property_text);
    pushCompactField(basic, "重要", detail.is_important_text);
    pushCompactField(basic, "消耗品", detail.is_consume_text);
    const numText =
        detail.num != null && detail.num !== ""
            ? detail.unit
                ? `${detail.num} ${detail.unit}`
                : String(detail.num)
            : "";
    pushCompactField(basic, "数量", numText);

    const physical = [];
    pushCompactField(physical, "材质", detail.texture);
    pushCompactField(physical, "颜色", detail.color);
    pushCompactField(physical, "形状", detail.shape);
    pushCompactField(physical, "重量", detail.weight);
    pushCompactField(physical, "尺寸", detail.size);
    pushCompactField(physical, "品牌", detail.brand);

    const buy = [];
    pushCompactField(buy, "购买日期", detail.buy_date);
    pushCompactField(buy, "价格", detail.buy_price);
    pushField(buy, "来源", detail.source);
    pushField(buy, "卖出日期", detail.sell_date);
    pushField(buy, "过期时间", detail.expires_time);
    pushField(buy, "保质期", detail.period_text);

    const other = [];
    pushField(other, "备注", detail.remark, { multiline: true });

    return [
        { key: "basic", title: "基本信息", rows: basic },
        { key: "physical", title: "物理属性", rows: physical },
        { key: "buy", title: "购置信息", rows: buy },
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
        relatedGoods: [],
        title: "物品详情",
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
            const detail = await MX.get("goods/detail", { id });
            if (!detail || !detail.id) {
                this.setData({
                    loading: false,
                    empty: true,
                    detail: null,
                    sections: [],
                    photoUrls: [],
                    relatedGoods: [],
                });
                return;
            }
            this.setData({
                detail,
                sections: buildSections(detail),
                photoUrls: Array.isArray(detail.photo_urls) ? detail.photo_urls : [],
                relatedGoods: Array.isArray(detail.related_goods) ? detail.related_goods : [],
                title: detail.name || "物品详情",
                canWrite: (await MX.waitLnnxReady(), MX.canWriteRecord(detail)),
                loading: false,
                empty: false,
            });
        } catch (e) {
            this.setData({ loading: false, empty: true, detail: null, sections: [], relatedGoods: [], canWrite: false });
        }
    },

    handlePreviewPhoto(e) {
        const { url } = e.currentTarget.dataset;
        if (!url) return;
        wx.previewImage({ current: url, urls: this.data.photoUrls });
    },

    handlePreviewSchematic(e) {
        const { url } = e.currentTarget.dataset;
        if (!url) return;
        wx.previewImage({ current: url, urls: [url] });
    },

    handleRelatedGoods(e) {
        const { id } = e.currentTarget.dataset;
        if (!id) return;
        MX.go(`/pages/goods/detail/index?id=${id}`);
    },

    handleFieldLink(e) {
        const { mode, id, label } = e.currentTarget.dataset;
        if (!mode || !id) return;
        wx.navigateTo({
            url: `/pages/goods/query/index?mode=${mode}&filterId=${id}&filterName=${encodeURIComponent(label || "")}`,
        });
    },

    handlePathLink(e) {
        const { mode, id, label } = e.currentTarget.dataset;
        if (!mode || !id) return;
        wx.navigateTo({
            url: `/pages/goods/query/index?mode=${mode}&filterId=${id}&filterName=${encodeURIComponent(label || "")}`,
        });
    },

    handleEdit() {
        if (!this.data.id || !this.data.canWrite) return;
        MX.go(`/pages/goods/form/index?id=${this.data.id}`);
    },

    handleDelete() {
        if (!this.data.id || !this.data.canWrite || this._deleting) return;
        const name = (this.data.detail && this.data.detail.name) || "";
        wx.showModal({
            title: "确认删除",
            content: name ? `确定删除物品「${name}」吗？` : "确定删除该物品吗？",
            confirmColor: "#a25248",
            success: async (res) => {
                if (!res.confirm) return;
                this._deleting = true;
                try {
                    await MX.get("goods/del", { id: this.data.id });
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
