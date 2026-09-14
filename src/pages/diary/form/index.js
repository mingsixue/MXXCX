import MX from "@utils/index";

const AFFILIATION = [
    { label: "敏", value: 1 },
    { label: "娟", value: 2 },
];
const STORE_KEY = "diary_affiliation";
const WEEK_LABELS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function weekLabel(day) {
    if (!day) return "";
    const parts = String(day).slice(0, 10).split("-").map(Number);
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return "";
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (Number.isNaN(d.getTime())) return "";
    return WEEK_LABELS[d.getDay()] || "";
}

function findIndex(options, value, fallback = 0) {
    const idx = options.findIndex((o) => Number(o.value) === Number(value));
    return idx >= 0 ? idx : fallback;
}

function isRepairDay(day) {
    const today = todayStr();
    return day && day < today ? 1 : 0;
}

Page({
    data: {
        submitting: false,
        day: "",
        week: "",
        content: "",
        contentLength: 0,
        tags: "",
        affiliation: 1,
        affiliationIndex: 0,
        affiliationOptions: AFFILIATION,
        isRepair: 0,
        isRepairText: "",
        affiliationLocked: false,
    },

    onLoad() {
        if (!MX.canAddOwned()) {
            wx.showToast({ title: "无权限新增", icon: "none" });
            setTimeout(() => MX.back(), 500);
            return;
        }
        const day = todayStr();
        const affiliationLocked = MX.isJuan();
        const defaultAff = MX.defaultWriteAffiliation();
        const saved = Number(MX.store.getItem(STORE_KEY) || 0);
        const affiliation = affiliationLocked
            ? defaultAff
            : saved === 1 || saved === 2
              ? saved
              : defaultAff;
        this.setData({
            day,
            week: weekLabel(day),
            affiliation,
            affiliationIndex: findIndex(AFFILIATION, affiliation),
            affiliationLocked,
            isRepair: 0,
            isRepairText: "",
        });
    },

    onShow() {
        wx.setNavigationBarColor({
            frontColor: "#000000",
            backgroundColor: "#f7f8fa",
        });
    },

    syncDayMeta(day) {
        const repair = isRepairDay(day);
        this.setData({
            day,
            week: weekLabel(day),
            isRepair: repair,
            isRepairText: repair ? "补记" : "",
        });
    },

    onNativeDayChange(e) {
        const day = (e.detail && e.detail.value) || todayStr();
        this.syncDayMeta(day);
    },

    onNativeAffiliationChange(e) {
        const affiliationIndex = Number(e.detail && e.detail.value) || 0;
        const opt = this.data.affiliationOptions[affiliationIndex];
        const affiliation = opt ? opt.value : 1;
        MX.store.setItem(STORE_KEY, affiliation);
        this.setData({ affiliationIndex, affiliation });
    },

    onContentInput(e) {
        const content = (e.detail && e.detail.value) || "";
        this.setData({ content, contentLength: content.length });
    },

    onTagsInput(e) {
        this.setData({ tags: (e.detail && e.detail.value) || "" });
    },

    async handleSubmit() {
        if (this.data.submitting) return;
        const content = (this.data.content || "").trim();
        if (!content) {
            wx.showToast({ title: "请填写日记内容", icon: "none" });
            return;
        }
        const day = this.data.day || todayStr();
        if (!day) {
            wx.showToast({ title: "请选择日期", icon: "none" });
            return;
        }

        const payload = {
            day,
            content,
            affiliation: MX.isJuan() ? 2 : this.data.affiliation,
            is_repair: isRepairDay(day),
            tags: (this.data.tags || "").trim(),
        };

        this.setData({ submitting: true });
        try {
            const data = await MX.post("diary/add", payload);
            wx.showToast({ title: "新增成功", icon: "success" });
            const id = data && data.id;
            setTimeout(() => {
                if (id) {
                    MX.go(`/pages/diary/detail/index?id=${id}`, "redirectTo");
                } else {
                    MX.back();
                }
            }, 400);
        } catch (e) {
            // request 已提示
        } finally {
            this.setData({ submitting: false });
        }
    },
});
