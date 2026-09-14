import MX from "@utils/index";

const WEEK_HEAD = ["一", "二", "三", "四", "五", "六", "日"];

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

function monthLabel(year, month) {
    return `${year}年${month}月`;
}

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
        loading: true,
        year: 0,
        month: 0,
        monthTitle: "",
        weekHead: WEEK_HEAD,
        monthDays: [],
        recordDays: 0,
        totalTimes: 0,
        selectedDay: "",
        dayLoading: false,
        records: [],
        dayTimes: 0,
        swipeButtons: [
            { text: "编辑", bgColor: "#C45C26", color: "#FFFFFF", width: 140 },
            { text: "删除", bgColor: "#D06B6B", color: "#FFFFFF", width: 140 },
        ],
    },

    async onLoad() {
        const now = new Date();
        const today = todayStr();
        await MX.waitLnnxReady();
        const affiliation = MX.selfAffiliation();
        this.setData({
            contentHeight: computeContentHeight(),
            affiliation,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            monthTitle: monthLabel(now.getFullYear(), now.getMonth() + 1),
            selectedDay: today,
        });
        if (!affiliation) {
            wx.showToast({ title: "用户归属无效", icon: "none" });
            setTimeout(() => MX.back(), 1200);
            return;
        }
        await this.loadMonth();
        await this.loadDay(today);
    },

    onShow() {
        wx.setNavigationBarColor({
            frontColor: "#ffffff",
            backgroundColor: "#C45C26",
        });
        if (this._needReload && this.data.affiliation) {
            this._needReload = false;
            this.loadMonth();
            this.loadDay(this.data.selectedDay);
        }
    },

    onPullDownRefresh() {
        Promise.all([this.loadMonth(), this.loadDay(this.data.selectedDay)]).finally(() =>
            wx.stopPullDownRefresh()
        );
    },

    handlePrevMonth() {
        let { year, month } = this.data;
        month -= 1;
        if (month < 1) {
            month = 12;
            year -= 1;
        }
        this.setData({ year, month, monthTitle: monthLabel(year, month) });
        this.loadMonth();
    },

    handleNextMonth() {
        let { year, month } = this.data;
        month += 1;
        if (month > 12) {
            month = 1;
            year += 1;
        }
        this.setData({ year, month, monthTitle: monthLabel(year, month) });
        this.loadMonth();
    },

    async loadMonth() {
        const { affiliation, year, month, selectedDay } = this.data;
        if (!affiliation) return;
        this.setData({ loading: true });
        try {
            const data = await MX.get("meal/month", { year, month });
            const apiDays = Array.isArray(data.days) ? data.days : [];
            const dayMap = {};
            apiDays.forEach((item) => {
                dayMap[item.day] = item;
            });

            const first = new Date(year, month - 1, 1);
            let padCount = first.getDay() - 1;
            if (padCount < 0) padCount = 6;

            const monthDays = [];
            for (let i = 0; i < padCount; i++) {
                monthDays.push({ day: `e${i}`, empty: true, cellClass: "month-cell--empty" });
            }

            const daysInMonth = new Date(year, month, 0).getDate();
            for (let d = 1; d <= daysInMonth; d++) {
                const day = `${year}-${pad(month)}-${pad(d)}`;
                const info = dayMap[day] || { times: 0, has_record: false };
                const hasRecord = !!info.has_record;
                const isSelected = day === selectedDay;
                let cellClass = "month-cell";
                if (hasRecord) cellClass += " month-cell--has";
                if (isSelected) cellClass += " month-cell--on";
                monthDays.push({
                    day,
                    dayNum: d,
                    empty: false,
                    hasRecord,
                    times: Number(info.times) || 0,
                    cellClass,
                });
            }

            this.setData({
                loading: false,
                monthDays,
                recordDays: Number(data.record_days) || 0,
                totalTimes: Number(data.total_times) || 0,
            });
        } catch (e) {
            this.setData({ loading: false });
        }
    },

    async loadDay(day) {
        if (!day || !this.data.affiliation) return;
        this.setData({ dayLoading: true, selectedDay: day });
        const monthDays = (this.data.monthDays || []).map((item) => {
            if (item.empty) return item;
            let cellClass = "month-cell";
            if (item.hasRecord) cellClass += " month-cell--has";
            if (item.day === day) cellClass += " month-cell--on";
            return { ...item, cellClass };
        });
        this.setData({ monthDays });

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

    handleDayTap(e) {
        const empty = e.currentTarget.dataset.empty;
        if (empty) return;
        const day = e.currentTarget.dataset.day;
        if (!day) return;
        this.loadDay(day);
    },

    handleAdd() {
        const day = this.data.selectedDay || todayStr();
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
                    this.loadMonth();
                    this.loadDay(this.data.selectedDay);
                } catch (err) {
                    // request 已提示
                }
            },
        });
    },
});
