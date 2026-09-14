import MX from "@utils/index";

function computeContentHeight() {
    const info = MX.getSystemInfo ? MX.getSystemInfo() : wx.getSystemInfoSync();
    const windowHeight = info.windowHeight || 667;
    const statusBarHeight = info.statusBarHeight || 20;
    const navHeight = statusBarHeight + 46;
    return Math.max(windowHeight - navHeight, 480);
}

function pad(n) {
    return n < 10 ? `0${n}` : String(n);
}

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDayTitle(day) {
    if (!day) return "今日";
    const today = todayStr();
    if (day === today) return "今日";
    const parts = String(day).split("-");
    if (parts.length !== 3) return day;
    return `${Number(parts[1])}月${Number(parts[2])}日`;
}

function formatRecordTime(createTime, day) {
    const raw = String(createTime || "").trim();
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(raw)) {
        return raw.slice(0, 16);
    }
    if (/^\d{2}:\d{2}/.test(raw) && day) {
        return `${String(day).slice(0, 10)} ${raw.slice(0, 5)}`;
    }
    if (day) {
        return String(day).slice(0, 10);
    }
    return raw;
}

Page({
    data: {
        contentHeight: 600,
        affiliation: 0,
        userName: "",
        day: "",
        dayTitle: "今日",
        dayLoading: true,
        records: [],
        dayTimes: 0,
        swipeButtons: [
            { text: "编辑", bgColor: "#C45C26", color: "#FFFFFF", width: 140 },
            { text: "删除", bgColor: "#D06B6B", color: "#FFFFFF", width: 140 },
        ],
    },

    async onLoad() {
        const day = todayStr();
        await MX.waitLnnxReady();
        const affiliation = MX.selfAffiliation();
        this.setData({
            contentHeight: computeContentHeight(),
            affiliation,
            userName: MX.selfAffiliationName(),
            day,
            dayTitle: formatDayTitle(day),
        });
        if (!affiliation) {
            wx.showToast({ title: "用户归属无效", icon: "none" });
            setTimeout(() => MX.back(), 1200);
            return;
        }
        await this.loadDay(day);
    },

    onShow() {
        wx.setNavigationBarColor({
            frontColor: "#ffffff",
            backgroundColor: "#C45C26",
        });
        if (this._needReload && this.data.affiliation) {
            this._needReload = false;
            this.loadDay(this.data.day || todayStr());
        }
    },

    onPullDownRefresh() {
        this.loadDay(this.data.day || todayStr()).finally(() =>
            wx.stopPullDownRefresh()
        );
    },

    async loadDay(day) {
        if (!day || !this.data.affiliation) return;
        this.setData({
            dayLoading: true,
            day,
            dayTitle: formatDayTitle(day),
        });
        try {
            const data = await MX.get("meal/day", { day });
            const records = (Array.isArray(data.records) ? data.records : []).map((r) => {
                const photo_urls = Array.isArray(r.photo_urls) ? r.photo_urls : [];
                return {
                    ...r,
                    photo_urls,
                    coverUrl: photo_urls[0] || "",
                    photoCount: photo_urls.length,
                    timeText: formatRecordTime(r.create_time || r.time, r.day || day),
                };
            });
            this.setData({
                dayLoading: false,
                records,
                dayTimes: Number(data.times) || records.length,
            });
        } catch (e) {
            this.setData({ dayLoading: false, records: [], dayTimes: 0 });
        }
    },

    handleCalendar() {
        MX.go("/pages/meal/calendar/index");
    },

    handleAdd() {
        const day = this.data.day || todayStr();
        this._needReload = true;
        MX.go(`/pages/meal/form/index?day=${day}`);
    },

    handleSwipeAction(e) {
        const id = Number((e.detail && e.detail.name) || 0);
        const text = (e.detail && e.detail.text) || "";
        if (!id) return;
        if (text === "编辑") {
            this.openEdit(id);
            return;
        }
        if (text === "删除") {
            this.confirmDelete(id);
        }
    },

    openEdit(id) {
        this._needReload = true;
        MX.go(`/pages/meal/form/index?id=${id}`);
    },

    handlePreview(e) {
        const urls = e.currentTarget.dataset.urls || [];
        const current = e.currentTarget.dataset.current || urls[0];
        if (!urls.length) return;
        wx.previewImage({ current, urls });
    },

    confirmDelete(id) {
        wx.showModal({
            title: "确认删除",
            content: "删除后不可恢复，图片也会一并删除",
            success: async (res) => {
                if (!res.confirm) return;
                try {
                    await MX.get("meal/del", { id });
                    wx.showToast({ title: "已删除", icon: "success" });
                    this.loadDay(this.data.day);
                } catch (err) {
                    // request 已提示
                }
            },
        });
    },
});
