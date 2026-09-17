import MX from "@utils/index";

const TYPE_TEXT = {
    1: "畜/禽/肉/蛋",
    2: "粮/油/米/面",
    3: "海鲜/水产品",
    4: "奶制品",
    5: "蔬菜",
    6: "水果",
    7: "饮料/茶/咖啡",
    8: "发酵食品",
    9: "调料品",
    10: "零食",
    11: "干货",
    12: "干果",
    13: "方便食品",
    14: "罐头",
    15: "酒类",
    16: "其他",
};

const SAVE_WAY = { 1: "常温", 2: "冷藏", 3: "冷冻" };
const STATUS = { 1: "正常", 2: "过期", 3: "丢弃", 4: "用完" };

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
        title: "新增食品",
        isEdit: false,
        id: 0,
        loading: false,
        submitting: false,
        name: "",
        type: 1,
        typeIndex: 0,
        typeOptions: mapOptions(TYPE_TEXT),
        saveWay: 2,
        saveWayIndex: 1,
        saveWayOptions: mapOptions(SAVE_WAY),
        status: 1,
        statusIndex: 0,
        statusOptions: mapOptions(STATUS),
        buyDate: "",
        expiresTime: "",
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
                title: "编辑食品",
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
            const detail = await MX.get("food/detail", { id });
            if (!detail || !detail.id) {
                this.setData({ loading: false });
                wx.showToast({ title: "记录不存在", icon: "none" });
                return;
            }
            const type = Number(detail.type) || 1;
            const saveWay = Number(detail.save_way) || 2;
            const status = Number(detail.status) || 1;
            this.setData({
                name: detail.name || "",
                type,
                typeIndex: findIndex(this.data.typeOptions, type),
                saveWay,
                saveWayIndex: findIndex(this.data.saveWayOptions, saveWay, 1),
                status,
                statusIndex: findIndex(this.data.statusOptions, status),
                buyDate: toDateOnly(detail.buy_date),
                expiresTime: toDateOnly(detail.expires_time),
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

    onRemarkChange(e) {
        this.setData({ remark: (e.detail && e.detail.value) || "" });
    },

    onTypeChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const typeIndex = Number(e.detail.value) || 0;
        const opt = this.data.typeOptions[typeIndex];
        this.setData({ typeIndex, type: opt ? opt.value : 1 });
    },

    onSaveWayChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const saveWayIndex = Number(e.detail.value) || 0;
        const opt = this.data.saveWayOptions[saveWayIndex];
        this.setData({ saveWayIndex, saveWay: opt ? opt.value : 2 });
    },

    onStatusChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const statusIndex = Number(e.detail.value) || 0;
        const opt = this.data.statusOptions[statusIndex];
        this.setData({ statusIndex, status: opt ? opt.value : 1 });
    },

    onBuyDateChange(e) {
        if (e.detail && e.detail.type === "date") {
            this.setData({ buyDate: e.detail.date || "" });
        }
    },

    onExpiresChange(e) {
        if (e.detail && e.detail.type === "date") {
            this.setData({ expiresTime: e.detail.date || "" });
        }
    },

    async handleAddPhoto() {
        const remain = 3 - this.data.photos.length;
        if (remain <= 0) return;
        try {
            const result = await MX.chooseAndUploadLnnxImage({ module: "food", count: remain });
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

        const payload = {
            name,
            type: this.data.type,
            save_way: this.data.saveWay,
            status: this.data.status,
            photo: this.data.photos.map((p) => p.key).join(","),
            remark: (this.data.remark || "").trim(),
            buy_date: this.data.buyDate ? `${this.data.buyDate} 00:00:00` : "",
            expires_time: this.data.expiresTime ? `${this.data.expiresTime} 00:00:00` : "",
        };

        this.setData({ submitting: true });
        try {
            if (this.data.isEdit) {
                await MX.post("food/edit", { ...payload, id: this.data.id });
                wx.showToast({ title: "保存成功", icon: "success" });
            } else {
                await MX.post("food/add", payload);
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
