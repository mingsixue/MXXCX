import MX from "@utils/index";

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];
const WEEK_HEAD = ["一", "二", "三", "四", "五", "六", "日"];
const TABS = [
    { key: "day", name: "每日" },
    { key: "week", name: "每周" },
    { key: "month", name: "每月" },
];

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

function formatDayLabel(day) {
    if (!day) return "";
    const parts = String(day).split("-");
    if (parts.length !== 3) return day;
    return `${parts[1]}/${parts[2]}`;
}

function formatCnDay(day) {
    if (!day) return "";
    const parts = String(day).split("-");
    if (parts.length !== 3) return day;
    return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`;
}

function shiftDate(day, delta) {
    const ts = strtotime(day) + delta * 86400000;
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function strtotime(day) {
    const parts = String(day).split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]).getTime();
}

function weekStartOf(day) {
    const d = new Date(strtotime(day));
    const w = d.getDay() || 7;
    return shiftDate(day, 1 - w);
}

function monthLabel(year, month) {
    return `${year}年${month}月`;
}

function buildTabItems(tab) {
    return TABS.map((item) => ({
        ...item,
        on: item.key === tab,
    }));
}

function periodNavLabels(tab) {
    if (tab === "week") return { prevLabel: "上一周", nextLabel: "下一周" };
    if (tab === "month") return { prevLabel: "上一月", nextLabel: "下一月" };
    return { prevLabel: "上一日", nextLabel: "下一日" };
}

function shortDuration(seconds) {
    const s = Number(seconds) || 0;
    if (s <= 0) return "";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h${m > 0 ? `${m}m` : ""}`;
    return `${m}m`;
}

function buildTypeLines(byType) {
    const map = byType || {};
    return Object.keys(map)
        .map((key) => {
            const bucket = map[key] || {};
            const seconds = Number(bucket.seconds) || 0;
            if (seconds <= 0 && !(bucket.segments && bucket.segments.length)) return null;
            return {
                key,
                name: key,
                text: bucket.text || "0分",
                count: Number(bucket.count) || 0,
                range: bucket.segments && bucket.segments[0]
                    ? `${bucket.segments[0].start_clock} - ${bucket.segments[0].end_clock}`
                    : "",
            };
        })
        .filter(Boolean);
}

Page({
    data: {
        contentHeight: 600,
        tabItems: buildTabItems("day"),
        tab: "day",
        prevLabel: "上一日",
        nextLabel: "下一日",
        periodLabel: "",
        affiliation: 0,
        loading: true,
        day: "",
        workText: "0分",
        toiletText: "0分",
        toiletCount: 0,
        meetingText: "0分",
        meetingCount: 0,
        mealText: "0分",
        mealCount: 0,
        sleepText: "0分",
        transportText: "0分",
        activityText: "0分",
        segments: [],
        workLines: [],
        mealLines: [],
        sleepLines: [],
        transportLines: [],
        activityLines: [],
        customs: [],
        weekStart: "",
        weekDays: [],
        year: 0,
        month: 0,
        weekHead: WEEK_HEAD,
        monthDays: [],
        activeDays: 0,
        dimCards: [],
    },

    async onLoad() {
        const today = MX.formatDate
            ? MX.formatDate(Date.now(), "yyyy-MM-dd")
            : this.todayStr();
        await MX.waitLnnxReady();
        const affiliation = MX.selfAffiliation();
        const now = new Date();
        this.setData({
            contentHeight: computeContentHeight(),
            affiliation,
            day: today,
            periodLabel: formatCnDay(today),
            year: now.getFullYear(),
            month: now.getMonth() + 1,
        });
        if (!affiliation) {
            wx.showToast({ title: "用户归属无效", icon: "none" });
            setTimeout(() => MX.back(), 1200);
            return;
        }
        this.loadData();
    },

    onShow() {
        wx.setNavigationBarColor({
            frontColor: "#ffffff",
            backgroundColor: "#1A6B8A",
        });
    },

    onPullDownRefresh() {
        this.loadData().finally(() => wx.stopPullDownRefresh());
    },

    todayStr() {
        const d = new Date();
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    },

    handleTab(e) {
        const tab = e.currentTarget.dataset.tab;
        if (tab === this.data.tab) return;
        this.setData({
            tab,
            tabItems: buildTabItems(tab),
            ...periodNavLabels(tab),
        });
        this.loadData();
    },

    handlePrev() {
        const { tab, day, weekStart, year, month } = this.data;
        if (tab === "day") {
            this.setData({ day: shiftDate(day, -1) });
        } else if (tab === "week") {
            this.setData({ day: shiftDate(weekStart || day, -7) });
        } else {
            let y = year;
            let m = month - 1;
            if (m < 1) {
                m = 12;
                y -= 1;
            }
            this.setData({ year: y, month: m });
        }
        this.loadData();
    },

    handleNext() {
        const { tab, day, weekStart, year, month } = this.data;
        if (tab === "day") {
            this.setData({ day: shiftDate(day, 1) });
        } else if (tab === "week") {
            this.setData({ day: shiftDate(weekStart || day, 7) });
        } else {
            let y = year;
            let m = month + 1;
            if (m > 12) {
                m = 1;
                y += 1;
            }
            this.setData({ year: y, month: m });
        }
        this.loadData();
    },

    async loadData() {
        const { tab, affiliation } = this.data;
        if (!affiliation) return;
        this.setData({ loading: true });
        try {
            if (tab === "day") {
                await this.loadDay();
            } else if (tab === "week") {
                await this.loadWeek();
            } else {
                await this.loadMonth();
            }
        } catch (e) {
            this.setData({ loading: false });
        }
    },

    async loadDay() {
        const { affiliation, day } = this.data;
        const data = await MX.get("time/day", { affiliation, day });
        const stats = data.stats || {};
        const detail = data.detail || {};
        const dayLabel = data.day || day;
        const sleep = detail.sleep || {};
        const sleepLines = [];
        if (sleep.nap && (Number(sleep.nap.seconds) > 0 || (sleep.nap.segments || []).length)) {
            const seg = (sleep.nap.segments || [])[0];
            sleepLines.push({
                key: "nap",
                name: "午睡",
                text: sleep.nap.text || "0分",
                range: seg ? `${seg.start_clock} - ${seg.end_clock}` : "",
            });
        }
        if (sleep.night && (Number(sleep.night.seconds) > 0 || (sleep.night.segments || []).length)) {
            const seg = (sleep.night.segments || [])[0];
            sleepLines.push({
                key: "night",
                name: "就寝",
                text: sleep.night.text || "0分",
                range: seg ? `${seg.start_clock} - ${seg.end_clock}` : "",
            });
        }
        if (sleep.sporadic && (Number(sleep.sporadic.seconds) > 0 || Number(sleep.sporadic.count) > 0)) {
            sleepLines.push({
                key: "sporadic",
                name: "零星睡觉",
                text: `${sleep.sporadic.count || 0}次 · ${sleep.sporadic.text || "0分"}`,
                range: "",
            });
        }

        const workLines = buildTypeLines(detail.work && detail.work.by_type);

        this.setData({
            loading: false,
            day: dayLabel,
            periodLabel: formatCnDay(dayLabel),
            workText: stats.work_text || "0分",
            toiletText: stats.toilet_text || "0分",
            toiletCount: Number(stats.toilet_count) || 0,
            meetingText: stats.meeting_text || "0分",
            meetingCount: Number(stats.meeting_count) || 0,
            mealText: stats.meal_text || "0分",
            mealCount: Number(stats.meal_count) || 0,
            sleepText: stats.sleep_text || "0分",
            transportText: stats.transport_text || "0分",
            activityText: stats.activity_text || "0分",
            segments: Array.isArray(data.segments) ? data.segments : [],
            workLines,
            mealLines: buildTypeLines(detail.meal && detail.meal.by_type),
            sleepLines,
            transportLines: buildTypeLines(detail.transport && detail.transport.by_type),
            activityLines: buildTypeLines(detail.activity && detail.activity.by_type),
            customs: Array.isArray(stats.customs) ? stats.customs : [],
            dimCards: [],
        });
    },

    buildDimCards(data) {
        return [
            { key: "work", name: "上班", value: data.work_text || "0分" },
            { key: "sleep", name: "睡觉", value: data.sleep_text || "0分" },
            { key: "meal", name: "吃饭", value: data.meal_text || "0分" },
            { key: "toilet", name: "如厕", value: `${data.toilet_count || 0}次 · ${data.toilet_text || "0分"}` },
            { key: "meeting", name: "开会", value: `${data.meeting_count || 0}次 · ${data.meeting_text || "0分"}` },
            { key: "transport", name: "交通", value: data.transport_text || "0分" },
            { key: "activity", name: "活动", value: data.activity_text || "0分" },
        ];
    },

    async loadWeek() {
        const { affiliation, day } = this.data;
        const data = await MX.get("time/week", { affiliation, date: day });
        const maxWork = Math.max(
            1,
            ...(Array.isArray(data.days) ? data.days : []).map(
                (item) => Number(item.work_seconds) || 0
            )
        );
        const days = (Array.isArray(data.days) ? data.days : []).map((item) => {
            const weekday = Number(item.weekday) || 1;
            const workSeconds = Number(item.work_seconds) || 0;
            return {
                ...item,
                label: WEEKDAY_LABELS[weekday - 1] || "",
                barText: shortDuration(workSeconds),
                barHeight: Math.max(
                    8,
                    Math.round((workSeconds / maxWork) * 160)
                ),
            };
        });
        const start = data.start || weekStartOf(day);
        const end = data.end || "";
        const weekRange = `${formatDayLabel(start)} - ${formatDayLabel(end)}`;
        this.setData({
            loading: false,
            weekStart: start,
            periodLabel: weekRange,
            workText: data.work_text || "0分",
            toiletText: data.toilet_text || "0分",
            toiletCount: Number(data.toilet_count) || 0,
            meetingText: data.meeting_text || "0分",
            meetingCount: Number(data.meeting_count) || 0,
            mealText: data.meal_text || "0分",
            mealCount: Number(data.active_days) || 0,
            sleepText: data.sleep_text || "0分",
            transportText: data.transport_text || "0分",
            activityText: data.activity_text || "0分",
            weekDays: days,
            day: start,
            activeDays: Number(data.active_days) || 0,
            segments: [],
            mealLines: [],
            sleepLines: [],
            transportLines: [],
            activityLines: [],
            workLines: [],
            customs: [],
            dimCards: this.buildDimCards(data),
        });
    },

    async loadMonth() {
        const { affiliation, year, month } = this.data;
        const data = await MX.get("time/month", { affiliation, year, month });
        const list = Array.isArray(data.days) ? data.days : [];
        const firstTs = strtotime(data.start || `${year}-${pad(month)}-01`);
        const firstWeekday = new Date(firstTs).getDay() || 7;
        const pads = [];
        for (let i = 1; i < firstWeekday; i++) {
            pads.push({
                day: `pad-${i}`,
                dayNum: "",
                empty: true,
                cellClass: "month-cell--empty",
            });
        }

        const monthDays = list.map((item) => {
            const workSeconds = Number(item.work_seconds) || 0;
            const dayNum = Number(String(item.day || "").split("-")[2]) || 0;
            const hasData = (Number(item.event_count) || 0) > 0;
            return {
                ...item,
                dayNum,
                empty: false,
                workShort: shortDuration(workSeconds),
                cellClass: hasData ? "month-cell--on" : "",
            };
        });

        const y = Number(data.year) || year;
        const m = Number(data.month) || month;
        this.setData({
            loading: false,
            year: y,
            month: m,
            periodLabel: monthLabel(y, m),
            workText: data.work_text || "0分",
            toiletText: data.toilet_text || "0分",
            toiletCount: Number(data.toilet_count) || 0,
            meetingText: data.meeting_text || "0分",
            meetingCount: Number(data.meeting_count) || 0,
            mealText: data.meal_text || "0分",
            mealCount: Number(data.active_days) || 0,
            sleepText: data.sleep_text || "0分",
            transportText: data.transport_text || "0分",
            activityText: data.activity_text || "0分",
            activeDays: Number(data.active_days) || 0,
            monthDays: pads.concat(monthDays),
            segments: [],
            workLines: [],
            mealLines: [],
            sleepLines: [],
            transportLines: [],
            activityLines: [],
            customs: [],
            dimCards: this.buildDimCards(data),
        });
    },

    handleDayTap(e) {
        const day = e.currentTarget.dataset.day;
        if (!day || String(day).indexOf("pad-") === 0) return;
        this.setData({
            tab: "day",
            tabItems: buildTabItems("day"),
            ...periodNavLabels("day"),
            day,
            periodLabel: formatCnDay(day),
        });
        this.loadData();
    },
});
