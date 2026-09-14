import MX from "@utils/index";

const IS_RENEWAL = [
    { label: "是", value: 1 },
    { label: "否", value: 0 },
];

const AFFILIATION = [
    { label: "敏", value: 1 },
    { label: "娟", value: 2 },
];

function findIndex(options, value, fallback = 0) {
    const idx = options.findIndex((o) => Number(o.value) === Number(value));
    return idx >= 0 ? idx : fallback;
}

function toDateOnly(v) {
    if (!v) return "";
    return String(v).slice(0, 10);
}

Page({
    data: {
        title: "新增续费",
        isEdit: false,
        id: 0,
        loading: false,
        submitting: false,
        name: "",
        endDate: "",
        price: "",
        cycle: "",
        isRenewal: 1,
        isRenewalIndex: 0,
        isRenewalOptions: IS_RENEWAL,
        affiliation: 1,
        affiliationIndex: 0,
        affiliationOptions: AFFILIATION,
        affiliationLocked: false,
        remark: "",
    },

    onLoad(options) {
        const id = Number(options.id || 0);
        const affiliationLocked = MX.isJuan();
        const defaultAff = MX.defaultWriteAffiliation();
        const base = {
            affiliationLocked,
            affiliation: defaultAff,
            affiliationIndex: findIndex(AFFILIATION, defaultAff),
        };
        if (id > 0) {
            this.setData({
                ...base,
                id,
                isEdit: true,
                title: "编辑续费",
                loading: true,
            });
            this.loadDetail(id);
        } else if (!MX.canAddShared()) {
            wx.showToast({ title: "无权限新增", icon: "none" });
            setTimeout(() => MX.back(), 500);
        } else {
            this.setData(base);
        }
    },

    onShow() {
        wx.setNavigationBarColor({
            frontColor: "#000000",
            backgroundColor: "#f5f6f8",
        });
    },

    async loadDetail(id) {
        try {
            const detail = await MX.get("renewal/detail", { id });
            if (!detail || !detail.id) {
                this.setData({ loading: false });
                wx.showToast({ title: "记录不存在", icon: "none" });
                return;
            }
            if (!MX.canWriteRecord(detail)) {
                wx.showToast({ title: "无权限编辑", icon: "none" });
                setTimeout(() => MX.back(), 500);
                return;
            }
            const isRenewal = detail.is_renewal == null ? 1 : Number(detail.is_renewal);
            const affiliation = MX.isJuan()
                ? 2
                : MX.normalizeAffiliation(detail.affiliation) || MX.defaultWriteAffiliation();
            this.setData({
                name: detail.name || "",
                endDate: toDateOnly(detail.end_time || detail.end_date),
                price: detail.price != null && detail.price !== "" ? String(detail.price) : "",
                cycle: detail.cycle || "",
                isRenewal,
                isRenewalIndex: findIndex(this.data.isRenewalOptions, isRenewal),
                affiliation,
                affiliationIndex: findIndex(AFFILIATION, affiliation),
                remark: detail.remark || "",
                loading: false,
            });
        } catch (e) {
            this.setData({ loading: false });
        }
    },

    onNameChange(e) {
        this.setData({ name: (e.detail && e.detail.value) || "" });
    },

    onPriceChange(e) {
        this.setData({ price: (e.detail && e.detail.value) || "" });
    },

    onCycleChange(e) {
        this.setData({ cycle: (e.detail && e.detail.value) || "" });
    },

    onRemarkChange(e) {
        this.setData({ remark: (e.detail && e.detail.value) || "" });
    },

    onEndDateChange(e) {
        if (e.detail && e.detail.type === "date") {
            this.setData({ endDate: e.detail.date || "" });
        }
    },

    onIsRenewalChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const isRenewalIndex = Number(e.detail.value) || 0;
        const opt = this.data.isRenewalOptions[isRenewalIndex];
        this.setData({ isRenewalIndex, isRenewal: opt ? opt.value : 1 });
    },

    onAffiliationChange(e) {
        if (this.data.affiliationLocked) return;
        if (!(e.detail && e.detail.type === "selector")) return;
        const affiliationIndex = Number(e.detail.value) || 0;
        const opt = this.data.affiliationOptions[affiliationIndex];
        this.setData({
            affiliationIndex,
            affiliation: opt ? opt.value : 1,
        });
    },

    async handleSubmit() {
        if (this.data.submitting) return;
        const name = (this.data.name || "").trim();
        if (!name) {
            wx.showToast({ title: "请填写事项名称", icon: "none" });
            return;
        }
        if (!this.data.endDate) {
            wx.showToast({ title: "请选择到期时间", icon: "none" });
            return;
        }

        const priceRaw = (this.data.price || "").trim();
        if (priceRaw !== "" && Number.isNaN(Number(priceRaw))) {
            wx.showToast({ title: "价格格式不正确", icon: "none" });
            return;
        }

        const payload = {
            name,
            end_time: this.data.endDate,
            cycle: (this.data.cycle || "").trim(),
            is_renewal: this.data.isRenewal,
            affiliation: MX.isJuan() ? 2 : this.data.affiliation,
            remark: (this.data.remark || "").trim(),
        };
        if (priceRaw !== "") {
            payload.price = priceRaw;
        } else if (this.data.isEdit) {
            payload.price = "";
        }

        this.setData({ submitting: true });
        try {
            if (this.data.isEdit) {
                await MX.post("renewal/edit", { ...payload, id: this.data.id });
                wx.showToast({ title: "保存成功", icon: "success" });
            } else {
                await MX.post("renewal/add", payload);
                wx.showToast({ title: "新增成功", icon: "success" });
            }
            setTimeout(() => MX.back(), 500);
        } catch (e) {
            // request 已提示
        } finally {
            this.setData({ submitting: false });
        }
    },
});
