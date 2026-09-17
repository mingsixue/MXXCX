import MX from "@utils/index";

const STATUS = {
    1: "正常",
    2: "失踪",
    3: "封箱",
    4: "卖出",
    5: "送人",
    6: "丢弃",
    7: "损坏",
};

const FREQUENCY = {
    1: "经常用",
    2: "偶尔用",
    3: "不常用",
    4: "几乎不用",
};

const SEASON = {
    1: "春季",
    2: "夏季",
    3: "秋季",
    4: "冬季",
    5: "春秋",
    6: "四季",
};

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

function buildMainPhoto(detail) {
    const key = String(detail.main_img || "").trim();
    if (!key) return [];
    const urls = detail.main_img_urls || detail.photo_urls || [];
    return [{ key, url: urls[0] || "" }];
}

function extractGoodsPhotos(item) {
    const mainUrls = Array.isArray(item && item.main_img_urls) ? item.main_img_urls.filter(Boolean) : [];
    if (mainUrls.length) return mainUrls;
    const photoUrls = Array.isArray(item && item.photo_urls) ? item.photo_urls.filter(Boolean) : [];
    return photoUrls;
}

function mapRelatedGoodsItem(item) {
    const photoUrls = extractGoodsPhotos(item);
    return {
        id: Number(item.id) || 0,
        name: item.name || (item.id ? `#${item.id}` : ""),
        category_name: item.category_name || "",
        photo_urls: photoUrls,
        thumb: photoUrls[0] || "",
    };
}

Page({
    data: {
        title: "新增物品",
        isEdit: false,
        id: 0,
        loading: true,
        submitting: false,
        name: "",
        affiliation: 1,
        affiliationIndex: 0,
        affiliationOptions: AFFILIATION,
        categoryId: 0,
        categoryIndex: -1,
        categoryOptions: [],
        storageId: 0,
        placeIndex: -1,
        placeOptions: [],
        status: 1,
        statusIndex: 0,
        statusOptions: mapOptions(STATUS),
        isFrequency: 2,
        frequencyIndex: 1,
        frequencyOptions: mapOptions(FREQUENCY),
        season: 6,
        seasonIndex: 5,
        seasonOptions: mapOptions(SEASON),
        num: "",
        unit: "",
        color: "",
        brand: "",
        source: "",
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
            this.setData({ ...base, id, isEdit: true, title: "编辑物品" });
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
            await Promise.all([this.loadCategories(), this.loadPlaces()]);
            if (id > 0) {
                await this.loadDetail(id);
            }
        } finally {
            this.setData({ loading: false });
        }
    },

    async loadCategories() {
        try {
            const rows = await MX.get("goods/categories");
            const list = Array.isArray(rows) ? rows : [];
            const categoryOptions = list
                .map((item) => ({
                    label: item.display_name || item.name || String(item.id),
                    value: Number(item.id) || 0,
                }))
                .filter((o) => o.value > 0);
            this.setData({ categoryOptions });
        } catch (e) {
            this.setData({ categoryOptions: [] });
        }
    },

    async loadPlaces() {
        try {
            const rows = await MX.get("goods/places");
            const list = Array.isArray(rows) ? rows : [];
            const placeOptions = list
                .map((item) => ({
                    label: item.display_name || item.name || String(item.id),
                    value: Number(item.id) || 0,
                }))
                .filter((o) => o.value > 0);
            this.setData({ placeOptions });
        } catch (e) {
            this.setData({ placeOptions: [] });
        }
    },

    async loadDetail(id) {
        const detail = await MX.get("goods/detail", { id });
        if (!detail || !detail.id) {
            wx.showToast({ title: "记录不存在", icon: "none" });
            return;
        }
        if (!MX.canWriteRecord(detail)) {
            wx.showToast({ title: "无权限编辑", icon: "none" });
            setTimeout(() => MX.back(), 500);
            return;
        }
        let affiliation = Number(detail.affiliation) || 1;
        if (MX.isJuan()) {
            affiliation = 2;
        }
        const categoryId = Number(detail.category_id) || 0;
        const storageId = Number(detail.storage_id) || 0;
        const status = Number(detail.status) || 1;
        const isFrequency = Number(detail.is_frequency) || 2;
        const season = Number(detail.season) || 6;
        const relatedItems = (Array.isArray(detail.related_goods) ? detail.related_goods : [])
            .map(mapRelatedGoodsItem)
            .filter((item) => item.id && item.name);
        this.setData({
            name: detail.name || "",
            affiliation,
            affiliationIndex: findIndex(this.data.affiliationOptions, affiliation),
            categoryId,
            categoryIndex: findIndex(this.data.categoryOptions, categoryId, -1),
            storageId,
            placeIndex: findIndex(this.data.placeOptions, storageId, -1),
            status,
            statusIndex: findIndex(this.data.statusOptions, status),
            isFrequency,
            frequencyIndex: findIndex(this.data.frequencyOptions, isFrequency, 1),
            season,
            seasonIndex: findIndex(this.data.seasonOptions, season, 5),
            num: detail.num != null && detail.num !== "" ? String(detail.num) : "",
            unit: detail.unit || "",
            color: detail.color || "",
            brand: detail.brand || "",
            source: detail.source || "",
            buyPrice: detail.buy_price != null && detail.buy_price !== "" ? String(detail.buy_price) : "",
            buyDate: toDateOnly(detail.buy_date),
            remark: detail.remark || "",
            photos: buildMainPhoto(detail),
            relatedItems,
            relatedResults: [],
            relatedKeyword: "",
        });
    },

    onNameChange(e) {
        this.setData({ name: (e.detail && e.detail.value) || "" });
    },
    onNumChange(e) {
        this.setData({ num: (e.detail && e.detail.value) || "" });
    },
    onUnitChange(e) {
        this.setData({ unit: (e.detail && e.detail.value) || "" });
    },
    onColorChange(e) {
        this.setData({ color: (e.detail && e.detail.value) || "" });
    },
    onBrandChange(e) {
        this.setData({ brand: (e.detail && e.detail.value) || "" });
    },
    onSourceChange(e) {
        this.setData({ source: (e.detail && e.detail.value) || "" });
    },
    onBuyPriceChange(e) {
        this.setData({ buyPrice: (e.detail && e.detail.value) || "" });
    },
    onRemarkChange(e) {
        this.setData({ remark: (e.detail && e.detail.value) || "" });
    },

    onAffiliationChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const affiliationIndex = Number(e.detail.value) || 0;
        const opt = this.data.affiliationOptions[affiliationIndex];
        this.setData({ affiliationIndex, affiliation: opt ? opt.value : 1 });
    },
    onCategoryChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const categoryIndex = Number(e.detail.value) || 0;
        const opt = this.data.categoryOptions[categoryIndex];
        this.setData({ categoryIndex, categoryId: opt ? opt.value : 0 });
    },
    onPlaceChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const placeIndex = Number(e.detail.value) || 0;
        const opt = this.data.placeOptions[placeIndex];
        this.setData({ placeIndex, storageId: opt ? opt.value : 0 });
    },
    onStatusChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const statusIndex = Number(e.detail.value) || 0;
        const opt = this.data.statusOptions[statusIndex];
        this.setData({ statusIndex, status: opt ? opt.value : 1 });
    },
    onFrequencyChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const frequencyIndex = Number(e.detail.value) || 0;
        const opt = this.data.frequencyOptions[frequencyIndex];
        this.setData({ frequencyIndex, isFrequency: opt ? opt.value : 2 });
    },
    onSeasonChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const seasonIndex = Number(e.detail.value) || 0;
        const opt = this.data.seasonOptions[seasonIndex];
        this.setData({ seasonIndex, season: opt ? opt.value : 6 });
    },
    onBuyDateChange(e) {
        if (e.detail && e.detail.type === "date") {
            this.setData({ buyDate: e.detail.date || "" });
        }
    },

    async handleAddPhoto() {
        if (this.data.photos.length >= 1) return;
        try {
            const result = await MX.chooseAndUploadLnnxImage({ module: "goods", count: 1 });
            if (result && result.key) {
                this.setData({ photos: [result] });
            }
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
            const data = await MX.get("goods/list", {
                name: keyword,
                page: 1,
                limit: 30,
            });
            const list = Array.isArray(data && data.list) ? data.list : [];
            const selectedIds = new Set(this.data.relatedItems.map((item) => Number(item.id)));
            const selfId = Number(this.data.id) || 0;
            const relatedResults = list
                .map(mapRelatedGoodsItem)
                .filter((item) => item.id && item.name && item.id !== selfId && !selectedIds.has(item.id));
            this.setData({ relatedResults });
            if (!relatedResults.length) {
                wx.showToast({ title: "未找到可添加的物品", icon: "none" });
            }
        } catch (e) {
            this.setData({ relatedResults: [] });
        } finally {
            this.setData({ relatedSearching: false });
        }
    },

    handleAddRelated(e) {
        const id = Number(e.currentTarget.dataset.id);
        if (!id) return;
        if (this.data.relatedItems.some((item) => Number(item.id) === id)) {
            wx.showToast({ title: "已添加", icon: "none" });
            return;
        }
        const source = this.data.relatedResults.find((item) => Number(item.id) === id);
        if (!source || !source.name) return;
        const nextIds = this.data.relatedItems
            .map((item) => Number(item.id))
            .filter((n) => n > 0)
            .concat([id]);
        const relevancyId = nextIds.join(",");
        if (relevancyId.length > 30) {
            wx.showToast({ title: "关联物品过多", icon: "none" });
            return;
        }
        const relatedItems = this.data.relatedItems.concat([source]);
        const relatedResults = this.data.relatedResults.filter((item) => Number(item.id) !== id);
        this.setData({ relatedItems, relatedResults });
    },

    handleRemoveRelated(e) {
        const id = Number(e.currentTarget.dataset.id);
        if (!id) return;
        this.setData({
            relatedItems: this.data.relatedItems.filter((item) => Number(item.id) !== id),
        });
    },

    handlePreviewRelatedItem(e) {
        const id = Number(e.currentTarget.dataset.id);
        const item = this.data.relatedItems.find((row) => Number(row.id) === id);
        const urls = item && Array.isArray(item.photo_urls) ? item.photo_urls.filter(Boolean) : [];
        if (!urls.length) {
            if (item && item.thumb) {
                wx.previewImage({ current: item.thumb, urls: [item.thumb] });
            }
            return;
        }
        wx.previewImage({
            current: urls[0],
            urls,
        });
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

    async handleSubmit() {
        if (this.data.submitting) return;
        const name = (this.data.name || "").trim();
        if (!name) {
            wx.showToast({ title: "请填写名称", icon: "none" });
            return;
        }

        const relevancyId = this.data.relatedItems
            .map((item) => Number(item.id))
            .filter((n) => n > 0)
            .join(",");
        if (relevancyId.length > 30) {
            wx.showToast({ title: "关联物品过多", icon: "none" });
            return;
        }

        const payload = {
            name,
            affiliation: MX.isJuan() ? 2 : this.data.affiliation,
            status: this.data.status,
            is_frequency: this.data.isFrequency,
            season: this.data.season,
            unit: (this.data.unit || "").trim(),
            color: (this.data.color || "").trim(),
            brand: (this.data.brand || "").trim(),
            source: (this.data.source || "").trim(),
            remark: (this.data.remark || "").trim(),
            main_img: this.data.photos.map((p) => p.key).join(","),
            buy_date: this.data.buyDate || "",
            relevancy_id: relevancyId,
        };
        if (this.data.categoryId > 0) {
            payload.category_id = this.data.categoryId;
        } else if (this.data.isEdit) {
            payload.category_id = "";
        }
        if (this.data.storageId > 0) {
            payload.storage_id = this.data.storageId;
        } else if (this.data.isEdit) {
            payload.storage_id = "";
        }
        if (this.data.num !== "") payload.num = Number(this.data.num) || 0;
        if (this.data.buyPrice !== "") payload.buy_price = this.data.buyPrice;

        this.setData({ submitting: true });
        try {
            if (this.data.isEdit) {
                await MX.post("goods/edit", { ...payload, id: this.data.id });
                wx.showToast({ title: "保存成功", icon: "success" });
            } else {
                await MX.post("goods/add", payload);
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
