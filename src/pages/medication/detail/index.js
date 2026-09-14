import MX from "@utils/index";
import { computeContentHeight, formatDateSlash, getExpiryStatus, pushField } from "@utils/nameSearch";

function pushCompactField(rows, label, value) {
    const previousLength = rows.length;
    pushField(rows, label, value);
    if (rows.length > previousLength) {
        rows[rows.length - 1].compact = true;
    }
}

function mapStatusState(status) {
    const value = Number(status) || 0;
    if (value === 1) return "normal";
    if (value === 2) return "expired";
    if (value === 3) return "used";
    return "";
}

function buildSections(detail) {
    if (!detail) return [];
    const basic = [];
    pushField(basic, "名称", detail.name);
    pushField(basic, "分类", detail.type_text);
    pushCompactField(basic, "剂型", detail.drug_form_text);
    pushCompactField(basic, "用法", detail.use_way_text);
    pushCompactField(basic, "规格", detail.spec);
    pushCompactField(basic, "处方药", detail.is_rx_text);
    pushCompactField(basic, "保存", detail.save_way_text);
    pushCompactField(basic, "数量", detail.num != null ? `${detail.num}${detail.unit || ""}` : "");
    pushField(basic, "用量", detail.dosage);

    const effect = [];
    pushField(effect, "主要功效", detail.main_effect, { multiline: true });
    pushField(effect, "注意事项", detail.notes, { multiline: true });

    const time = [];
    pushField(time, "购买日期", formatDateSlash(detail.buy_date));
    pushField(time, "过期日期", formatDateSlash(detail.expire_date));
    pushField(time, "剩余天数", detail.remainingText);
    pushField(time, "批号", detail.batch_no);

    const other = [];
    pushField(other, "备注", detail.remark, { multiline: true });

    return [
        { key: "basic", title: "基本信息", rows: basic },
        { key: "effect", title: "功效与注意", rows: effect },
        { key: "time", title: "时间与批号", rows: time },
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
        title: "药品详情",
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
            const detail = await MX.get("medication/detail", { id });
            if (!detail || !detail.id) {
                this.setData({ loading: false, empty: true, detail: null, sections: [], photoUrls: [] });
                return;
            }
            const displayDetail = {
                ...detail,
                ...getExpiryStatus(detail.expire_date),
                statusState: mapStatusState(detail.status),
            };
            this.setData({
                detail: displayDetail,
                sections: buildSections(displayDetail),
                photoUrls: Array.isArray(detail.photo_urls) ? detail.photo_urls : [],
                title: detail.name || "药品详情",
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
        MX.go(`/pages/medication/form/index?id=${this.data.id}`);
    },

    handleDelete() {
        if (!this.data.id || !this.data.canWrite || this._deleting) return;
        const name = (this.data.detail && this.data.detail.name) || "";
        wx.showModal({
            title: "确认删除",
            content: name ? `确定删除药品「${name}」吗？` : "确定删除该药品吗？",
            confirmColor: "#a25248",
            success: async (res) => {
                if (!res.confirm) return;
                this._deleting = true;
                try {
                    await MX.get("medication/del", { id: this.data.id });
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
