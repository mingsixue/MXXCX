import MX from "@utils/index";

const MEAL_TYPE = {
    1: "早饭",
    2: "午饭",
    3: "晚饭",
    4: "宵夜",
    5: "零食饮料",
};

const PHOTO_MAX = 9;
const PHOTO_MAX_LEN = 1000;

function buildMealTypeOptions(selected) {
    const current = Number(selected) || 1;
    return Object.keys(MEAL_TYPE).map((k) => {
        const value = Number(k);
        return {
            label: MEAL_TYPE[k],
            value,
            on: value === current,
        };
    });
}

function pad(n) {
    return n < 10 ? `0${n}` : String(n);
}

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDayDisplay(day) {
    const parts = String(day || "").split("-");
    if (parts.length !== 3) return day || "";
    return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`;
}

function buildPhotos(keysStr, urls) {
    const keys = String(keysStr || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    const list = Array.isArray(urls) ? urls : [];
    return keys.map((key, i) => ({ key, url: list[i] || "" }));
}

function guessMealTypeByHour() {
    const h = new Date().getHours();
    if (h < 10) return 1;
    if (h < 14) return 2;
    if (h < 20) return 3;
    if (h < 24) return 4;
    return 1;
}

function filterLocations(options, keyword) {
    const list = Array.isArray(options) ? options : [];
    const kw = String(keyword || "").trim().toLowerCase();
    if (!kw) return list.slice();
    return list.filter((item) => String(item).toLowerCase().indexOf(kw) >= 0);
}

Page({
    data: {
        title: "记录三餐",
        isEdit: false,
        id: 0,
        loading: false,
        submitting: false,
        day: "",
        dayDisplay: "",
        mealType: 1,
        mealTypeOptions: buildMealTypeOptions(1),
        content: "",
        contentLen: 0,
        location: "",
        locationOptions: [],
        locationFiltered: [],
        locationDropdownVisible: false,
        photos: [],
    },

    onLoad(options) {
        const id = Number(options.id || 0);
        this.loadLocations();
        if (id > 0) {
            this.setData({
                id,
                isEdit: true,
                title: "编辑三餐",
                loading: true,
            });
            this.loadDetail(id);
            return;
        }

        const day = options.day || todayStr();
        const mealType = guessMealTypeByHour();
        this.setData({
            day,
            dayDisplay: formatDayDisplay(day),
            mealType,
            mealTypeOptions: buildMealTypeOptions(mealType),
            title: "记录三餐",
        });
    },

    onShow() {
        wx.setNavigationBarColor({
            frontColor: "#000000",
            backgroundColor: "#f7f3ef",
        });
    },

    async loadLocations() {
        try {
            const res = await MX.get("meal/locations", { limit: 30 });
            const list = (res && Array.isArray(res.list) ? res.list : [])
                .map((item) => String(item || "").trim())
                .filter(Boolean);
            this.setData({
                locationOptions: list,
                locationFiltered: filterLocations(list, this.data.location),
            });
        } catch (e) {
            this.setData({ locationOptions: [], locationFiltered: [] });
        }
    },

    async loadDetail(id) {
        try {
            const detail = await MX.get("meal/detail", { id });
            if (!detail || !detail.id) {
                this.setData({ loading: false });
                wx.showToast({ title: "记录不存在", icon: "none" });
                return;
            }
            const mealType = Number(detail.meal_type) || 1;
            const day = String(detail.day || "").slice(0, 10);
            const content = detail.content || "";
            const location = detail.location || "";
            this.setData({
                day,
                dayDisplay: formatDayDisplay(day),
                mealType,
                mealTypeOptions: buildMealTypeOptions(mealType),
                content,
                contentLen: content.length,
                location,
                locationFiltered: filterLocations(this.data.locationOptions, location),
                photos: buildPhotos(detail.photo, detail.photo_urls),
                loading: false,
            });
        } catch (e) {
            this.setData({ loading: false });
        }
    },

    onMealTypeTap(e) {
        const mealType = Number(e.currentTarget.dataset.value) || 1;
        if (mealType === this.data.mealType) return;
        this.setData({
            mealType,
            mealTypeOptions: buildMealTypeOptions(mealType),
        });
    },

    clearLocationBlurTimer() {
        if (this._locationBlurTimer) {
            clearTimeout(this._locationBlurTimer);
            this._locationBlurTimer = null;
        }
    },

    openLocationDropdown(keyword) {
        const locationFiltered = filterLocations(this.data.locationOptions, keyword);
        this.clearLocationBlurTimer();
        this.setData({
            locationFiltered,
            locationDropdownVisible: locationFiltered.length > 0,
        });
    },

    onLocationInput(e) {
        const location = (e.detail && e.detail.value) || "";
        const locationFiltered = filterLocations(this.data.locationOptions, location);
        this.clearLocationBlurTimer();
        this.setData({
            location,
            locationFiltered,
            locationDropdownVisible: locationFiltered.length > 0,
        });
    },

    onLocationFocus() {
        this.openLocationDropdown("");
    },

    onLocationBlur() {
        this.clearLocationBlurTimer();
        this._locationBlurTimer = setTimeout(() => {
            this.setData({ locationDropdownVisible: false });
            this._locationBlurTimer = null;
        }, 180);
    },

    onLocationToggle() {
        if (this.data.locationDropdownVisible) {
            this.clearLocationBlurTimer();
            this.setData({ locationDropdownVisible: false });
            return;
        }
        this.openLocationDropdown("");
    },

    onLocationSelect(e) {
        const value = String(e.currentTarget.dataset.value || "").trim();
        if (!value) return;
        this.clearLocationBlurTimer();
        this.setData({
            location: value,
            locationFiltered: filterLocations(this.data.locationOptions, value),
            locationDropdownVisible: false,
        });
    },

    onContentInput(e) {
        const content = (e.detail && e.detail.value) || "";
        this.setData({
            content,
            contentLen: content.length,
        });
    },

    async handleAddPhoto() {
        const remain = PHOTO_MAX - this.data.photos.length;
        if (remain <= 0) return;
        try {
            const result = await MX.chooseAndUploadLnnxImage({
                module: "meal",
                count: remain,
            });
            const list = Array.isArray(result) ? result : result ? [result] : [];
            const next = this.data.photos.concat(list);
            const joined = next.map((p) => p.key).join(",");
            if (joined.length > PHOTO_MAX_LEN) {
                wx.showToast({ title: "图片过多，请减少张数", icon: "none" });
                return;
            }
            this.setData({ photos: next });
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
        const day = (this.data.day || "").trim();
        if (!day) {
            wx.showToast({ title: "日期无效", icon: "none" });
            return;
        }
        if (!this.data.mealType) {
            wx.showToast({ title: "请选择餐次", icon: "none" });
            return;
        }

        const photo = this.data.photos.map((p) => p.key).filter(Boolean).join(",");
        if (photo.length > PHOTO_MAX_LEN) {
            wx.showToast({ title: "图片过多，请减少张数", icon: "none" });
            return;
        }

        const payload = {
            day,
            meal_type: this.data.mealType,
            content: (this.data.content || "").trim(),
            location: (this.data.location || "").trim(),
            photo,
        };

        this.setData({ submitting: true });
        try {
            if (this.data.isEdit) {
                await MX.post("meal/edit", { ...payload, id: this.data.id });
            } else {
                await MX.post("meal/add", payload);
            }
            wx.showToast({ title: "保存成功", icon: "success" });
            setTimeout(() => MX.back(), 500);
        } catch (e) {
            // request 已提示
        } finally {
            this.setData({ submitting: false });
        }
    },
});
