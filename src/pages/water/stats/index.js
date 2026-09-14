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

function formatDayCn(day) {
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

function buildHero(tab, fillPercent, drinkDays, goalMl) {
    if (tab === "day") {
        return {
            heroThirdValue: `${fillPercent}%`,
            heroThirdLabel: "完成",
        };
    }
    if (tab === "month") {
        return {
            heroThirdValue: drinkDays,
            heroThirdLabel: "有记录天数",
        };
    }
    return {
        heroThirdValue: goalMl,
        heroThirdLabel: "日目标",
    };
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
        dayLabel: "",
        totalMl: 0,
        times: 0,
        goalMl: 2000,
        fillPercent: 0,
        records: [],
        heroThirdValue: "0%",
        heroThirdLabel: "完成",
        weekStart: "",
        weekEnd: "",
        weekRange: "",
        weekDays: [],
        year: 0,
        month: 0,
        monthTitle: "",
        drinkDays: 0,
        weekHead: WEEK_HEAD,
        monthDays: [],
        monthBars: [],
        maxDayMl: 1,
    },

    async onLoad() {
        const today = MX.formatDate ? MX.formatDate(Date.now(), "yyyy-MM-dd") : this.todayStr();
        await MX.waitLnnxReady();
        const affiliation = MX.selfAffiliation();
        const now = new Date();
        this.setData({
            contentHeight: computeContentHeight(),
            affiliation,
            day: today,
            dayLabel: today,
            periodLabel: formatDayCn(today),
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            monthTitle: monthLabel(now.getFullYear(), now.getMonth() + 1),
            ...buildHero("day", 0, 0, 2000),
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
            const next = shiftDate(day, -1);
            this.setData({ day: next, dayLabel: next });
        } else if (tab === "week") {
            const next = shiftDate(weekStart || day, -7);
            this.setData({ day: next });
        } else {
            let y = year;
            let m = month - 1;
            if (m < 1) {
                m = 12;
                y -= 1;
            }
            this.setData({ year: y, month: m, monthTitle: monthLabel(y, m) });
        }
        this.loadData();
    },

    handleNext() {
        const { tab, day, weekStart, year, month } = this.data;
        if (tab === "day") {
            const next = shiftDate(day, 1);
            this.setData({ day: next, dayLabel: next });
        } else if (tab === "week") {
            const next = shiftDate(weekStart || day, 7);
            this.setData({ day: next });
        } else {
            let y = year;
            let m = month + 1;
            if (m > 12) {
                m = 1;
                y += 1;
            }
            this.setData({ year: y, month: m, monthTitle: monthLabel(y, m) });
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
        const data = await MX.get("water/day", { affiliation, day });
        const fillPercent = Number(data.fill_percent) || 0;
        const goalMl = Number(data.goal_ml) || 2000;
        const dayLabel = data.day || day;
        this.setData({
            loading: false,
            day: dayLabel,
            dayLabel,
            periodLabel: formatDayCn(dayLabel),
            totalMl: Number(data.total_ml) || 0,
            times: Number(data.times) || 0,
            goalMl,
            fillPercent,
            records: Array.isArray(data.records) ? data.records : [],
            ...buildHero("day", fillPercent, 0, goalMl),
        });
    },

    async loadWeek() {
        const { affiliation, day } = this.data;
        const data = await MX.get("water/week", { affiliation, date: day });
        const goalMl = Number(data.goal_ml) || 2000;
        const days = (Array.isArray(data.days) ? data.days : []).map((item) => {
            const weekday = Number(item.weekday) || 1;
            const totalMl = Number(item.total_ml) || 0;
            return {
                ...item,
                label: WEEKDAY_LABELS[weekday - 1] || "",
                dayShort: formatDayLabel(item.day),
                mlText: totalMl > 0 ? String(totalMl) : "",
                barHeight: Math.max(
                    8,
                    Math.min(160, Math.round((totalMl / Math.max(goalMl, 1)) * 160))
                ),
            };
        });
        const start = data.start || weekStartOf(day);
        const end = data.end || "";
        const weekRange = `${formatDayLabel(start)} - ${formatDayLabel(end)}`;
        this.setData({
            loading: false,
            weekStart: start,
            weekEnd: end,
            weekRange,
            periodLabel: weekRange,
            totalMl: Number(data.total_ml) || 0,
            times: Number(data.times) || 0,
            goalMl,
            weekDays: days,
            day: start,
            ...buildHero("week", 0, 0, goalMl),
        });
    },

    async loadMonth() {
        const { affiliation, year, month } = this.data;
        const data = await MX.get("water/month", { affiliation, year, month });
        const list = Array.isArray(data.days) ? data.days : [];
        let maxDayMl = 1;
        list.forEach((item) => {
            maxDayMl = Math.max(maxDayMl, Number(item.total_ml) || 0);
        });

        const firstTs = strtotime(data.start || `${year}-${pad(month)}-01`);
        const firstWeekday = new Date(firstTs).getDay() || 7;
        const pads = [];
        for (let i = 1; i < firstWeekday; i++) {
            pads.push({
                day: `pad-${i}`,
                dayNum: "",
                empty: true,
                hasDrink: false,
                cellClass: "month-cell--empty",
            });
        }

        const monthDays = list.map((item) => {
            const ml = Number(item.total_ml) || 0;
            const dayNum = Number(String(item.day || "").split("-")[2]) || 0;
            const hasDrink = ml > 0;
            return {
                ...item,
                dayNum,
                empty: false,
                hasDrink,
                cellClass: hasDrink ? "month-cell--on" : "",
            };
        });

        const monthBars = monthDays
            .filter((item) => item.hasDrink)
            .map((item) => ({
                ...item,
                fill_width: Math.min(100, Number(item.fill_percent) || 0),
            }));
        const y = Number(data.year) || year;
        const m = Number(data.month) || month;
        const title = monthLabel(y, m);
        const drinkDays = Number(data.drink_days) || 0;
        const goalMl = Number(data.goal_ml) || 2000;

        this.setData({
            loading: false,
            year: y,
            month: m,
            monthTitle: title,
            periodLabel: title,
            totalMl: Number(data.total_ml) || 0,
            times: Number(data.times) || 0,
            drinkDays,
            goalMl,
            monthDays: pads.concat(monthDays),
            monthBars,
            maxDayMl,
            ...buildHero("month", 0, drinkDays, goalMl),
        });
    },

    handleDayTap(e) {
        const day = e.currentTarget.dataset.day;
        if (!day || String(day).indexOf("pad-") === 0) return;
        this.setData({
            tab: "day",
            tabItems: buildTabItems("day"),
            day,
            dayLabel: day,
            periodLabel: formatDayCn(day),
        });
        this.loadData();
    },
});
