import MX from "@utils/index";
import { resolveColorCss } from "@utils/colorPreview";

const SEASON = {
    1: "春季",
    2: "夏季",
    3: "秋季",
    4: "冬季",
    5: "春秋",
    6: "四季",
};

const STATUS = { 1: "正常", 2: "消失", 3: "丢弃" };
const APPLICABLE = { 1: "女", 2: "男", 3: "通用" };
const AFFILIATION = [
    { label: "敏", value: 1 },
    { label: "娟", value: 2 },
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

function splitTagValues(raw) {
    return String(raw || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

function joinTagValues(list) {
    return (list || [])
        .map((s) => String(s || "").trim())
        .filter(Boolean)
        .join(",");
}

function markEnumOptions(allItems, selectedNames) {
    const selected = new Set((selectedNames || []).map(String));
    const options = (allItems || []).map((item) => {
        const name = String(item.name || "");
        return {
            ...item,
            name,
            selected: selected.has(name),
        };
    });
    (selectedNames || []).forEach((name) => {
        const n = String(name || "").trim();
        if (!n) return;
        if (options.some((item) => item.name === n)) return;
        options.unshift({ id: 0, name: n, selected: true });
    });
    return options;
}

function markColorOptions(allColors, selectedNames) {
    return markEnumOptions(allColors, selectedNames).map((item) => {
        const css = resolveColorCss(item.name);
        return {
            ...item,
            swatch: css,
            swatchLight:
                css === "#ffffff" ||
                css === "#fffcf0" ||
                css === "#f5f0e6" ||
                css === "transparent",
        };
    });
}

Page({
    data: {
        title: "新增衣物",
        isEdit: false,
        id: 0,
        loading: true,
        submitting: false,
        name: "",
        type: 0,
        typeIndex: -1,
        typeOptions: [],
        season: 6,
        seasonIndex: 5,
        seasonOptions: mapOptions(SEASON),
        affiliation: 1,
        affiliationIndex: 0,
        affiliationOptions: AFFILIATION,
        status: 1,
        statusIndex: 0,
        statusOptions: mapOptions(STATUS),
        applicable: 3,
        applicableIndex: 2,
        applicableOptions: mapOptions(APPLICABLE),
        color: "",
        colorText: "",
        selectedColors: [],
        allColors: [],
        colorOptions: [],
        colorPopupVisible: false,
        location: "",
        fabric: "",
        fabricText: "",
        selectedFabrics: [],
        allFabrics: [],
        fabricOptions: [],
        fabricPopupVisible: false,
        source: "",
        sourceText: "",
        selectedSources: [],
        allSources: [],
        sourceOptions: [],
        sourcePopupVisible: false,
        buyPrice: "",
        buyDate: "",
        remark: "",
        photos: [],
        relatedItems: [],
        relatedKeyword: "",
        relatedSearching: false,
        relatedResults: [],
        affiliationLocked: false,
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
            this.setData({ ...base, id, isEdit: true, title: "编辑衣物" });
        } else {
            this.setData(base);
        }
        this.init(id);
    },

    onShow() {
        wx.setNavigationBarColor({
            frontColor: "#000000",
            backgroundColor: "#f5f6f8",
        });
    },

    async init(id) {
        this.setData({ loading: true });
        try {
            await Promise.all([
                this.loadCategories(),
                this.loadColorEnums(),
                this.loadFabricEnums(),
                this.loadSourceEnums(),
            ]);
            if (id > 0) {
                await this.loadDetail(id);
            }
        } finally {
            this.setData({ loading: false });
        }
    },

    async loadCategories() {
        try {
            const rows = await MX.get("clothes/categories");
            const list = Array.isArray(rows) ? rows : [];
            const typeOptions = list.map((item) => ({
                label: item.display_name || item.name || String(item.id),
                value: Number(item.id) || 0,
            })).filter((o) => o.value > 0);
            this.setData({ typeOptions });
        } catch (e) {
            this.setData({ typeOptions: [] });
        }
    },

    async loadColorEnums() {
        try {
            const rows = await MX.get("clothes/enums", { type: 3 });
            const allColors = (Array.isArray(rows) ? rows : [])
                .map((item) => ({
                    id: Number(item.id) || 0,
                    name: String(item.name || "").trim(),
                }))
                .filter((item) => item.id && item.name);
            this.setData({
                allColors,
                colorOptions: markColorOptions(allColors, this.data.selectedColors),
            });
        } catch (e) {
            this.setData({ allColors: [], colorOptions: [] });
        }
    },

    async loadFabricEnums() {
        try {
            const rows = await MX.get("clothes/enums", { type: 7 });
            const allFabrics = (Array.isArray(rows) ? rows : [])
                .map((item) => ({
                    id: Number(item.id) || 0,
                    name: String(item.name || "").trim(),
                }))
                .filter((item) => item.id && item.name);
            this.setData({
                allFabrics,
                fabricOptions: markEnumOptions(allFabrics, this.data.selectedFabrics),
            });
        } catch (e) {
            this.setData({ allFabrics: [], fabricOptions: [] });
        }
    },

    async loadSourceEnums() {
        try {
            const rows = await MX.get("clothes/enums", { type: 4 });
            const allSources = (Array.isArray(rows) ? rows : [])
                .map((item) => ({
                    id: Number(item.id) || 0,
                    name: String(item.name || "").trim(),
                }))
                .filter((item) => item.id && item.name);
            this.setData({
                allSources,
                sourceOptions: markEnumOptions(allSources, this.data.selectedSources),
            });
        } catch (e) {
            this.setData({ allSources: [], sourceOptions: [] });
        }
    },

    applyColorSelection(selectedColors) {
        const list = (selectedColors || []).map((s) => String(s).trim()).filter(Boolean);
        this.setData({
            selectedColors: list,
            color: joinTagValues(list),
            colorText: list.join("、"),
            colorOptions: markColorOptions(this.data.allColors, list),
        });
    },

    applyFabricSelection(selectedFabrics) {
        const list = (selectedFabrics || []).map((s) => String(s).trim()).filter(Boolean);
        this.setData({
            selectedFabrics: list,
            fabric: joinTagValues(list),
            fabricText: list.join("、"),
            fabricOptions: markEnumOptions(this.data.allFabrics, list),
        });
    },

    applySourceSelection(selectedSources) {
        const list = (selectedSources || []).map((s) => String(s).trim()).filter(Boolean).slice(0, 1);
        this.setData({
            selectedSources: list,
            source: list[0] || "",
            sourceText: list[0] || "",
            sourceOptions: markEnumOptions(this.data.allSources, list),
        });
    },

    async loadDetail(id) {
        const detail = await MX.get("clothes/detail", { id });
        if (!detail || !detail.id) {
            wx.showToast({ title: "记录不存在", icon: "none" });
            return;
        }
        if (!MX.canWriteRecord(detail)) {
            wx.showToast({ title: "无权限编辑", icon: "none" });
            setTimeout(() => MX.back(), 500);
            return;
        }
        const type = Number(detail.type) || 0;
        const season = Number(detail.season) || 6;
        let affiliation = Number(detail.affiliation) || 1;
        if (MX.isJuan()) {
            affiliation = 2;
        }
        const status = Number(detail.status) || 1;
        const applicable = Number(detail.applicable) || 3;
        const selectedColors = splitTagValues(detail.color);
        const relatedItems = (Array.isArray(detail.related_items) ? detail.related_items : [])
            .map((item) => ({
                id: Number(item.id) || 0,
                name: item.name || (item.id ? `#${item.id}` : ""),
                type_text: item.type_text || "",
            }))
            .filter((item) => item.id && item.name);
        this.setData({
            name: detail.name || "",
            type,
            typeIndex: findIndex(this.data.typeOptions, type, -1),
            season,
            seasonIndex: findIndex(this.data.seasonOptions, season, 5),
            affiliation,
            affiliationIndex: findIndex(this.data.affiliationOptions, affiliation),
            status,
            statusIndex: findIndex(this.data.statusOptions, status),
            applicable,
            applicableIndex: findIndex(this.data.applicableOptions, applicable, 2),
            location: detail.location || "",
            buyPrice: detail.buy_price != null && detail.buy_price !== "" ? String(detail.buy_price) : "",
            buyDate: toDateOnly(detail.buy_date),
            remark: detail.remark || "",
            photos: buildPhotos(detail.photo, detail.photo_urls),
            relatedItems,
            relatedResults: [],
            relatedKeyword: "",
        });
        this.applyColorSelection(selectedColors);
        this.applyFabricSelection(splitTagValues(detail.fabric));
        this.applySourceSelection(splitTagValues(detail.source).slice(0, 1));
    },

    onNameChange(e) {
        this.setData({ name: (e.detail && e.detail.value) || "" });
    },
    onLocationChange(e) {
        this.setData({ location: (e.detail && e.detail.value) || "" });
    },
    onBuyPriceChange(e) {
        this.setData({ buyPrice: (e.detail && e.detail.value) || "" });
    },
    onRemarkChange(e) {
        this.setData({ remark: (e.detail && e.detail.value) || "" });
    },

    handleOpenColorPopup() {
        this.setData({
            colorPopupVisible: true,
            colorOptions: markColorOptions(this.data.allColors, this.data.selectedColors),
        });
    },

    handleCloseColorPopup() {
        this.setData({ colorPopupVisible: false });
    },

    handleToggleColor(e) {
        const name = String((e.currentTarget.dataset && e.currentTarget.dataset.name) || "").trim();
        if (!name) return;
        const selected = new Set(this.data.selectedColors.map(String));
        if (selected.has(name)) {
            selected.delete(name);
        } else {
            selected.add(name);
        }
        this.applyColorSelection(Array.from(selected));
    },

    handleOpenFabricPopup() {
        this.setData({
            fabricPopupVisible: true,
            fabricOptions: markEnumOptions(this.data.allFabrics, this.data.selectedFabrics),
        });
    },

    handleCloseFabricPopup() {
        this.setData({ fabricPopupVisible: false });
    },

    handleToggleFabric(e) {
        const name = String((e.currentTarget.dataset && e.currentTarget.dataset.name) || "").trim();
        if (!name) return;
        const selected = new Set(this.data.selectedFabrics.map(String));
        if (selected.has(name)) {
            selected.delete(name);
        } else {
            selected.add(name);
        }
        this.applyFabricSelection(Array.from(selected));
    },

    handleOpenSourcePopup() {
        this.setData({
            sourcePopupVisible: true,
            sourceOptions: markEnumOptions(this.data.allSources, this.data.selectedSources),
        });
    },

    handleCloseSourcePopup() {
        this.setData({ sourcePopupVisible: false });
    },

    handleToggleSource(e) {
        const name = String((e.currentTarget.dataset && e.currentTarget.dataset.name) || "").trim();
        if (!name) return;
        const current = this.data.selectedSources[0] || "";
        this.applySourceSelection(current === name ? [] : [name]);
    },

    onRelatedKeywordInput(e) {
        this.setData({ relatedKeyword: (e.detail && e.detail.value) || "" });
    },

    handleClearRelatedKeyword() {
        this.setData({ relatedKeyword: "", relatedResults: [] });
    },

    async handleSearchRelated() {
        const keyword = (this.data.relatedKeyword || "").trim();
        if (!keyword) {
            wx.showToast({ title: "请输入名称搜索", icon: "none" });
            return;
        }
        this.setData({ relatedSearching: true });
        try {
            const data = await MX.get("clothes/list", {
                name: keyword,
                page: 1,
                limit: 30,
            });
            const list = Array.isArray(data && data.list) ? data.list : [];
            const selectedIds = new Set(this.data.relatedItems.map((item) => Number(item.id)));
            const selfId = Number(this.data.id) || 0;
            const relatedResults = list
                .map((item) => {
                    const photoUrls = Array.isArray(item.photo_urls)
                        ? item.photo_urls.filter(Boolean)
                        : [];
                    return {
                        id: Number(item.id) || 0,
                        name: item.name || "",
                        type_text: item.type_text || "",
                        photo_urls: photoUrls,
                        thumb: photoUrls[0] || "",
                    };
                })
                .filter((item) => item.id && item.name && item.id !== selfId && !selectedIds.has(item.id));
            this.setData({ relatedResults });
            if (!relatedResults.length) {
                wx.showToast({ title: "未找到可添加的衣物", icon: "none" });
            }
        } catch (e) {
            this.setData({ relatedResults: [] });
        } finally {
            this.setData({ relatedSearching: false });
        }
    },

    handleAddRelated(e) {
        const id = Number(e.currentTarget.dataset.id);
        const name = String(e.currentTarget.dataset.name || "").trim();
        const typeText = String(e.currentTarget.dataset.type || "").trim();
        if (!id || !name) return;
        if (this.data.relatedItems.some((item) => Number(item.id) === id)) {
            wx.showToast({ title: "已添加", icon: "none" });
            return;
        }
        const relatedItems = this.data.relatedItems.concat([
            { id, name, type_text: typeText },
        ]);
        const relatedResults = this.data.relatedResults.filter((item) => Number(item.id) !== id);
        this.setData({ relatedItems, relatedResults });
    },

    handlePreviewRelatedResult(e) {
        const id = Number(e.currentTarget.dataset.id);
        const item = this.data.relatedResults.find((row) => Number(row.id) === id);
        const urls = item && Array.isArray(item.photo_urls) ? item.photo_urls.filter(Boolean) : [];
        if (!urls.length) return;
        wx.previewImage({
            current: urls[0],
            urls,
        });
    },

    handleRemoveRelated(e) {
        const id = Number(e.currentTarget.dataset.id);
        if (!id) return;
        this.setData({
            relatedItems: this.data.relatedItems.filter((item) => Number(item.id) !== id),
        });
    },

    onTypeChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const typeIndex = Number(e.detail.value) || 0;
        const opt = this.data.typeOptions[typeIndex];
        this.setData({ typeIndex, type: opt ? opt.value : 0 });
    },
    onSeasonChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const seasonIndex = Number(e.detail.value) || 0;
        const opt = this.data.seasonOptions[seasonIndex];
        this.setData({ seasonIndex, season: opt ? opt.value : 6 });
    },
    onAffiliationChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const affiliationIndex = Number(e.detail.value) || 0;
        const opt = this.data.affiliationOptions[affiliationIndex];
        this.setData({ affiliationIndex, affiliation: opt ? opt.value : 1 });
    },
    onStatusChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const statusIndex = Number(e.detail.value) || 0;
        const opt = this.data.statusOptions[statusIndex];
        this.setData({ statusIndex, status: opt ? opt.value : 1 });
    },
    onApplicableChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const applicableIndex = Number(e.detail.value) || 0;
        const opt = this.data.applicableOptions[applicableIndex];
        this.setData({ applicableIndex, applicable: opt ? opt.value : 3 });
    },
    onBuyDateChange(e) {
        if (e.detail && e.detail.type === "date") {
            this.setData({ buyDate: e.detail.date || "" });
        }
    },

    async handleAddPhoto() {
        const remain = 3 - this.data.photos.length;
        if (remain <= 0) return;
        try {
            wx.showLoading({ title: "上传中...", mask: true });
            const result = await MX.chooseAndUploadLnnxImage({ module: "clothes", count: remain });
            const list = Array.isArray(result) ? result : result ? [result] : [];
            this.setData({ photos: this.data.photos.concat(list) });
        } catch (e) {
            if (e && e.errMsg && String(e.errMsg).indexOf("cancel") >= 0) return;
            wx.showToast({ title: (e && e.message) || "上传失败", icon: "none" });
        } finally {
            wx.hideLoading();
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

        const payload = {
            name,
            type: this.data.type,
            season: this.data.season,
            affiliation: MX.isJuan() ? 2 : this.data.affiliation,
            status: this.data.status,
            applicable: this.data.applicable,
            color: joinTagValues(this.data.selectedColors),
            location: (this.data.location || "").trim(),
            fabric: joinTagValues(this.data.selectedFabrics),
            source: (this.data.selectedSources[0] || "").trim(),
            related_clothing: this.data.relatedItems
                .map((item) => Number(item.id))
                .filter((n) => n > 0)
                .join(","),
            photo: this.data.photos.map((p) => p.key).join(","),
            remark: (this.data.remark || "").trim(),
            buy_date: this.data.buyDate ? `${this.data.buyDate} 00:00:00` : "",
            buy_price: this.data.buyPrice !== "" ? Number(this.data.buyPrice) : "",
        };

        this.setData({ submitting: true });
        try {
            if (this.data.isEdit) {
                await MX.post("clothes/edit", { ...payload, id: this.data.id });
                wx.showToast({ title: "保存成功", icon: "success" });
            } else {
                await MX.post("clothes/add", payload);
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
