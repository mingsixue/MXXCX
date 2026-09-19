import MX from "@utils/index";

const TYPE_TEXT = {
    1: "发烧疼痛",
    2: "感冒咳嗽",
    3: "肠胃药",
    4: "抗过敏药",
    5: "外用药",
    6: "五官用药",
    7: "慢病药",
    8: "儿童药品",
    9: "中成药",
    10: "消毒用品",
    11: "维生素",
};

const DRUG_FORM = {
    1: "片剂",
    2: "胶囊",
    3: "颗粒",
    4: "口服液",
    5: "药剂",
    6: "软膏",
    7: "贴剂",
    8: "滴液",
    9: "药丸",
    10: "注射",
    11: "气雾剂",
    12: "其他",
};

const USE_WAY = { 1: "内服", 2: "外用", 3: "注射" };
const SAVE_WAY = { 1: "常温", 2: "避光密封", 3: "冷藏2-8℃", 4: "冷冻<0℃" };
const STATUS = { 1: "正常", 2: "过期", 3: "用完" };
const AFFILIATION = { 1: "敏", 2: "娟", 3: "通用" };
const PLACE = { 1: "抽屉柜", 2: "药箱", 3: "冰箱" };
const IS_RX = [
    { label: "否", value: 0 },
    { label: "是", value: 1 },
];

function mapOptions(map) {
    return Object.keys(map).map((k) => ({ label: map[k], value: Number(k) }));
}

function findIndex(options, value, fallback = 0) {
    const idx = options.findIndex((o) => Number(o.value) === Number(value));
    return idx >= 0 ? idx : fallback;
}

function toDateOnly(v) {
    if (!v) return "";
    return String(v).slice(0, 10);
}

function buildPhotos(keysStr, urls) {
    const keys = String(keysStr || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    const list = Array.isArray(urls) ? urls : [];
    return keys.map((key, i) => ({ key, url: list[i] || "" }));
}

Page({
    data: {
        title: "新增药品",
        isEdit: false,
        id: 0,
        loading: false,
        submitting: false,
        name: "",
        type: 0,
        typeIndex: -1,
        typeOptions: mapOptions(TYPE_TEXT),
        drugForm: 0,
        drugFormIndex: -1,
        drugFormOptions: mapOptions(DRUG_FORM),
        useWay: 0,
        useWayIndex: -1,
        useWayOptions: mapOptions(USE_WAY),
        saveWay: 0,
        saveWayIndex: -1,
        saveWayOptions: mapOptions(SAVE_WAY),
        status: 0,
        statusIndex: -1,
        statusOptions: mapOptions(STATUS),
        affiliation: 0,
        affiliationIndex: -1,
        affiliationOptions: mapOptions(AFFILIATION),
        place: 0,
        placeIndex: -1,
        placeOptions: mapOptions(PLACE),
        isRx: 0,
        isRxIndex: -1,
        isRxOptions: IS_RX,
        spec: "",
        dosage: "",
        num: "",
        unit: "",
        batchNo: "",
        mainEffect: "",
        notes: "",
        buyDate: "",
        expireDate: "",
        remark: "",
        photos: [],
    },

    onLoad(options) {
        const id = Number(options.id || 0);
        if (id > 0) {
            if (!MX.canWriteShared()) {
                wx.showToast({ title: "无权限编辑", icon: "none" });
                setTimeout(() => MX.back(), 500);
                return;
            }
            this.setData({
                id,
                isEdit: true,
                title: "编辑药品",
                loading: true,
            });
            this.loadDetail(id);
        } else if (!MX.canAddShared()) {
            wx.showToast({ title: "无权限新增", icon: "none" });
            setTimeout(() => MX.back(), 500);
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
            const detail = await MX.get("medication/detail", { id });
            if (!detail || !detail.id) {
                this.setData({ loading: false });
                wx.showToast({ title: "记录不存在", icon: "none" });
                return;
            }
            const type = Number(detail.type) || 0;
            const drugForm = Number(detail.drug_form) || 0;
            const useWay = Number(detail.use_way) || 0;
            const saveWay = Number(detail.save_way) || 0;
            const status = Number(detail.status) || 0;
            const affiliation = Number(detail.affiliation) || 0;
            const place = Number(detail.place) || 0;
            const isRx = Number(detail.is_rx);
            this.setData({
                name: detail.name || "",
                type,
                typeIndex: findIndex(this.data.typeOptions, type, -1),
                drugForm,
                drugFormIndex: findIndex(this.data.drugFormOptions, drugForm, -1),
                useWay,
                useWayIndex: findIndex(this.data.useWayOptions, useWay, -1),
                saveWay,
                saveWayIndex: findIndex(this.data.saveWayOptions, saveWay, -1),
                status,
                statusIndex: findIndex(this.data.statusOptions, status, -1),
                affiliation,
                affiliationIndex: findIndex(this.data.affiliationOptions, affiliation, -1),
                place,
                placeIndex: findIndex(this.data.placeOptions, place, -1),
                isRx: Number.isNaN(isRx) ? 0 : isRx,
                isRxIndex: findIndex(this.data.isRxOptions, Number.isNaN(isRx) ? -1 : isRx, -1),
                spec: detail.spec || "",
                dosage: detail.dosage || "",
                num: detail.num != null && detail.num !== "" ? String(detail.num) : "",
                unit: detail.unit || "",
                batchNo: detail.batch_no || "",
                mainEffect: detail.main_effect || "",
                notes: detail.notes || "",
                buyDate: toDateOnly(detail.buy_date),
                expireDate: toDateOnly(detail.expire_date),
                remark: detail.remark || "",
                photos: buildPhotos(detail.photo, detail.photo_urls),
                loading: false,
            });
        } catch (e) {
            this.setData({ loading: false });
        }
    },

    onNameChange(e) {
        this.setData({ name: (e.detail && e.detail.value) || "" });
    },
    onSpecChange(e) {
        this.setData({ spec: (e.detail && e.detail.value) || "" });
    },
    onDosageChange(e) {
        this.setData({ dosage: (e.detail && e.detail.value) || "" });
    },
    onNumChange(e) {
        this.setData({ num: (e.detail && e.detail.value) || "" });
    },
    onUnitChange(e) {
        this.setData({ unit: (e.detail && e.detail.value) || "" });
    },
    onBatchNoChange(e) {
        this.setData({ batchNo: (e.detail && e.detail.value) || "" });
    },
    onMainEffectChange(e) {
        this.setData({ mainEffect: (e.detail && e.detail.value) || "" });
    },
    onNotesChange(e) {
        this.setData({ notes: (e.detail && e.detail.value) || "" });
    },
    onRemarkChange(e) {
        this.setData({ remark: (e.detail && e.detail.value) || "" });
    },

    onTypeChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const typeIndex = Number(e.detail.value) || 0;
        const opt = this.data.typeOptions[typeIndex];
        this.setData({ typeIndex, type: opt ? opt.value : 0 });
    },
    onDrugFormChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const drugFormIndex = Number(e.detail.value) || 0;
        const opt = this.data.drugFormOptions[drugFormIndex];
        this.setData({ drugFormIndex, drugForm: opt ? opt.value : 0 });
    },
    onUseWayChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const useWayIndex = Number(e.detail.value) || 0;
        const opt = this.data.useWayOptions[useWayIndex];
        this.setData({ useWayIndex, useWay: opt ? opt.value : 0 });
    },
    onSaveWayChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const saveWayIndex = Number(e.detail.value) || 0;
        const opt = this.data.saveWayOptions[saveWayIndex];
        this.setData({ saveWayIndex, saveWay: opt ? opt.value : 0 });
    },
    onStatusChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const statusIndex = Number(e.detail.value) || 0;
        const opt = this.data.statusOptions[statusIndex];
        this.setData({ statusIndex, status: opt ? opt.value : 0 });
    },
    onAffiliationChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const affiliationIndex = Number(e.detail.value) || 0;
        const opt = this.data.affiliationOptions[affiliationIndex];
        this.setData({ affiliationIndex, affiliation: opt ? opt.value : 0 });
    },
    onPlaceChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const placeIndex = Number(e.detail.value) || 0;
        const opt = this.data.placeOptions[placeIndex];
        this.setData({ placeIndex, place: opt ? opt.value : 0 });
    },
    onIsRxChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const isRxIndex = Number(e.detail.value) || 0;
        const opt = this.data.isRxOptions[isRxIndex];
        this.setData({ isRxIndex, isRx: opt ? opt.value : 0 });
    },
    onBuyDateChange(e) {
        if (e.detail && e.detail.type === "date") {
            this.setData({ buyDate: e.detail.date || "" });
        }
    },
    onExpireDateChange(e) {
        if (e.detail && e.detail.type === "date") {
            this.setData({ expireDate: e.detail.date || "" });
        }
    },

    async handleAddPhoto() {
        const remain = 3 - this.data.photos.length;
        if (remain <= 0) return;
        try {
            const result = await MX.chooseAndUploadLnnxImage({ module: "medication", count: remain });
            const list = Array.isArray(result) ? result : result ? [result] : [];
            this.setData({ photos: this.data.photos.concat(list) });
        } catch (e) {
            if (e && e.errMsg && String(e.errMsg).indexOf("cancel") >= 0) return;
            wx.showToast({ title: (e && e.message) || "上传失败", icon: "none" });
        }
    },

    handlePreviewPhoto(e) {
        const index = Number(e.currentTarget.dataset.index);
        const urls = (this.data.photos || []).map((p) => p && p.url).filter(Boolean);
        if (!urls.length) return;
        wx.previewImage({
            current: urls[index] || urls[0],
            urls,
        });
    },

    handleRemovePhoto(e) {
        const index = Number(e.currentTarget.dataset.index);
        if (Number.isNaN(index)) return;
        const photos = this.data.photos.slice();
        photos.splice(index, 1);
        this.setData({ photos });
    },

    async handleSubmit() {
        if (this.data.submitting) return;
        const name = (this.data.name || "").trim();
        if (!name) {
            wx.showToast({ title: "请填写名称", icon: "none" });
            return;
        }
        if (!this.data.type) {
            wx.showToast({ title: "请选择分类", icon: "none" });
            return;
        }
        if (!this.data.drugForm) {
            wx.showToast({ title: "请选择剂型", icon: "none" });
            return;
        }
        if (!this.data.useWay) {
            wx.showToast({ title: "请选择用法", icon: "none" });
            return;
        }
        if (!this.data.saveWay) {
            wx.showToast({ title: "请选择保存方式", icon: "none" });
            return;
        }
        if (!this.data.status) {
            wx.showToast({ title: "请选择状态", icon: "none" });
            return;
        }
        const payload = {
            name,
            type: this.data.type,
            drug_form: this.data.drugForm,
            use_way: this.data.useWay,
            save_way: this.data.saveWay,
            status: this.data.status,
            spec: (this.data.spec || "").trim(),
            dosage: (this.data.dosage || "").trim(),
            unit: (this.data.unit || "").trim(),
            batch_no: (this.data.batchNo || "").trim(),
            main_effect: (this.data.mainEffect || "").trim(),
            notes: (this.data.notes || "").trim(),
            photo: this.data.photos.map((p) => p.key).join(","),
            remark: (this.data.remark || "").trim(),
            buy_date: this.data.buyDate || "",
            expire_date: this.data.expireDate || "",
        };
        if (this.data.num !== "") {
            payload.num = Number(this.data.num) || 0;
        }
        if (this.data.isRxIndex >= 0) {
            payload.is_rx = this.data.isRx;
        }
        if (this.data.affiliationIndex >= 0) {
            payload.affiliation = this.data.affiliation;
        }
        if (this.data.placeIndex >= 0) {
            payload.place = this.data.place;
        }

        this.setData({ submitting: true });
        try {
            if (this.data.isEdit) {
                await MX.post("medication/edit", { ...payload, id: this.data.id });
                wx.showToast({ title: "保存成功", icon: "success" });
            } else {
                await MX.post("medication/add", payload);
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
