import MX from "@utils/index";
import { ensureStaffPage } from "../tabbar/menus";

function computeContentHeight() {
    const info = MX.getSystemInfo ? MX.getSystemInfo() : wx.getSystemInfoSync();
    const windowHeight = info.windowHeight || 667;
    const statusBarHeight = info.statusBarHeight || 20;
    const navHeight = statusBarHeight + 46;
    return Math.max(windowHeight - navHeight, 480);
}

function emptyStats() {
    return {
        work_seconds: 0,
        work_text: "0分",
        meal_seconds: 0,
        meal_count: 0,
        meal_text: "0分",
        toilet_seconds: 0,
        toilet_count: 0,
        toilet_text: "0分",
        meeting_seconds: 0,
        meeting_count: 0,
        meeting_text: "0分",
        sleep_seconds: 0,
        sleep_count: 0,
        sleep_text: "0分",
        transport_seconds: 0,
        transport_text: "0分",
        activity_seconds: 0,
        activity_text: "0分",
        customs: [],
    };
}

function emptyStatus() {
    return {
        working: false,
        work_open: null,
        toilet_out: false,
        meeting_out: false,
        meal_out: false,
        meal_open: null,
        sleeping: false,
        sleep_open: null,
        transport_open: null,
        activity_open: null,
        custom_open: null,
    };
}

function emptyDetail() {
    return {
        work: {
            total: { seconds: 0, text: "0分" },
            by_type: {},
            seconds: 0,
            text: "0分",
            segments: [],
        },
        toilet: { seconds: 0, count: 0, text: "0分", segments: [] },
        meeting: { seconds: 0, count: 0, text: "0分", segments: [] },
        meal: { total: { seconds: 0, count: 0, text: "0分" }, by_type: {} },
        sleep: {
            total: { seconds: 0, count: 0, text: "0分" },
            nap: { seconds: 0, count: 0, text: "0分", segments: [] },
            night: { seconds: 0, count: 0, text: "0分", segments: [] },
            sporadic: { seconds: 0, count: 0, text: "0分", segments: [] },
        },
        transport: { total: { seconds: 0, text: "0分" }, by_type: {} },
        activity: { total: { seconds: 0, text: "0分" }, by_type: {} },
        customs: [],
    };
}

const WORK_TYPES = [
    { key: "上午班", mark: "上", start: "上午班", end: "结束上午班", ing: "上午班中" },
    { key: "下午班", mark: "下", start: "下午班", end: "结束下午班", ing: "下午班中" },
    { key: "晚上班", mark: "晚", start: "晚上班", end: "结束晚上班", ing: "晚上班中" },
    { key: "自由工作", mark: "自", start: "自由工作", end: "结束自由工作", ing: "自由工作中" },
];

const MEAL_TYPES = [
    { key: "早饭", mark: "早", start: "早饭", end: "结束早饭", ing: "早饭中" },
    { key: "午饭", mark: "午", start: "午饭", end: "结束午饭", ing: "午饭中" },
    { key: "晚饭", mark: "晚", start: "晚饭", end: "结束晚饭", ing: "晚饭中" },
    { key: "宵夜", mark: "宵", start: "宵夜", end: "结束宵夜", ing: "宵夜中" },
];

const SLEEP_TYPES = [
    { key: "起床", mark: "起", instant: true, start: "起床" },
    { key: "午睡", mark: "午", start: "午睡", end: "结束午睡", ing: "午睡中" },
    { key: "就寝", mark: "寝", instant: true, start: "就寝" },
    { key: "零星", mark: "零", start: "零星睡觉", end: "结束零星睡觉", ing: "零星睡觉中" },
];

const TRANSPORT_TYPES = [
    { key: "开车", mark: "车", start: "开车", end: "结束开车", ing: "开车中" },
    { key: "地铁", mark: "铁", start: "地铁", end: "结束地铁", ing: "地铁中" },
    { key: "公交", mark: "公", start: "公交", end: "结束公交", ing: "公交中" },
    { key: "骑行", mark: "骑", start: "骑行", end: "结束骑行", ing: "骑行中" },
    { key: "步行", mark: "步", start: "步行", end: "结束步行", ing: "步行中" },
];

const ACTIVITY_TYPES = [
    { key: "健身", mark: "健", start: "健身", end: "结束健身", ing: "健身中" },
    { key: "游玩", mark: "玩", start: "游玩", end: "结束游玩", ing: "游玩中" },
    { key: "学习", mark: "学", start: "学习", end: "结束学习", ing: "学习中" },
    { key: "洗漱", mark: "漱", start: "洗漱", end: "结束洗漱", ing: "洗漱中" },
    { key: "洗澡", mark: "澡", start: "洗澡", end: "结束洗澡", ing: "洗澡中" },
    { key: "娱乐", mark: "乐", start: "娱乐", end: "结束娱乐", ing: "娱乐中" },
    { key: "烧饭", mark: "烧", start: "烧饭", end: "结束烧饭", ing: "烧饭中" },
    { key: "洗碗", mark: "碗", start: "洗碗", end: "结束洗碗", ing: "洗碗中" },
];

const DAILY_TYPES = [
    { key: "洗漱", mark: "漱", start: "洗漱", end: "结束洗漱", ing: "洗漱中" },
    { key: "洗澡", mark: "澡", start: "洗澡", end: "结束洗澡", ing: "洗澡中" },
    { key: "娱乐", mark: "乐", start: "娱乐", end: "结束娱乐", ing: "娱乐中" },
    { key: "烧饭", mark: "烧", start: "烧饭", end: "结束烧饭", ing: "烧饭中" },
    { key: "洗碗", mark: "碗", start: "洗碗", end: "结束洗碗", ing: "洗碗中" },
];

const SPORT_TYPES = [
    { key: "健身", mark: "健", start: "健身", end: "结束健身", ing: "健身中" },
    { key: "游玩", mark: "玩", start: "游玩", end: "结束游玩", ing: "游玩中" },
    { key: "学习", mark: "学", start: "学习", end: "结束学习", ing: "学习中" },
];

const PRESET_BLOCK_NAMES = new Set([
    "上午班", "下午班", "晚上班", "自由工作",
    "早饭", "午饭", "晚饭", "宵夜",
    "午睡", "晚上", "零星", "起床", "就寝",
    "开车", "地铁", "公交", "骑行", "步行",
    "健身", "游玩", "学习", "洗漱", "洗澡", "娱乐", "烧饭", "洗碗",
    "开会", "结束开会", "上厕所", "上厕所回来",
]);

function mapTypedActions(types, openKey) {
    return types.map((item) => {
        if (item.instant) {
            return {
                key: item.key,
                mark: item.mark || item.key.slice(0, 1),
                isOpen: false,
                instant: true,
                displayLabel: item.start,
                ing: "",
            };
        }
        const isOpen = !!openKey && openKey === item.key;
        return {
            key: item.key,
            mark: item.mark || item.key.slice(0, 1),
            isOpen,
            displayLabel: isOpen ? item.end : item.start,
            ing: item.ing,
        };
    });
}

function mapCustomActions(actions, customOpen) {
    // 已升级为预设的行为，不再出现在自定义常用列表
    const list = Array.isArray(actions) ? actions : [];
    return list
        .map((item) => {
            const label = typeof item === "string" ? item : String(item?.label || "");
            return label;
        })
        .filter((label) => label && !PRESET_BLOCK_NAMES.has(label))
        .map((label) => {
            const isOpen = !!customOpen && customOpen === label;
            return {
                label,
                isOpen,
                displayLabel: isOpen ? `结束${label}` : label,
            };
        });
}

function buildWorkLines(detail) {
    const byType = detail?.work?.by_type || {};
    return WORK_TYPES.map((item) => {
        const bucket = byType[item.key] || {};
        const seconds = Number(bucket.seconds) || 0;
        const segs = Array.isArray(bucket.segments) ? bucket.segments : [];
        const first = segs[0];
        let range = "";
        if (first) {
            range = `${first.start_clock || ""} - ${first.end_clock || ""}`;
        }
        return {
            key: item.key,
            name: item.key,
            text: bucket.text || "0分",
            seconds,
            range,
            show: seconds > 0 || segs.length > 0,
        };
    }).filter((row) => row.show);
}

function buildMealLines(detail) {
    const byType = detail?.meal?.by_type || {};
    return MEAL_TYPES.map((item) => {
        const bucket = byType[item.key] || {};
        const seconds = Number(bucket.seconds) || 0;
        const segs = Array.isArray(bucket.segments) ? bucket.segments : [];
        const first = segs[0];
        let range = "";
        if (first) {
            range = `${first.start_clock || ""} - ${first.end_clock || ""}`;
        }
        return {
            key: item.key,
            name: item.key,
            text: bucket.text || "0分",
            seconds,
            range,
            show: seconds > 0 || segs.length > 0,
        };
    }).filter((row) => row.show);
}

function buildTransportLines(detail) {
    const byType = detail?.transport?.by_type || {};
    return TRANSPORT_TYPES.map((item) => {
        const bucket = byType[item.key] || {};
        const seconds = Number(bucket.seconds) || 0;
        return {
            key: item.key,
            name: item.key,
            text: bucket.text || "0分",
            count: Number(bucket.count) || 0,
            show: seconds > 0,
        };
    }).filter((row) => row.show);
}

function buildActivityLines(detail) {
    const byType = detail?.activity?.by_type || {};
    return ACTIVITY_TYPES.map((item) => {
        const bucket = byType[item.key] || {};
        const seconds = Number(bucket.seconds) || 0;
        return {
            key: item.key,
            name: item.key,
            text: bucket.text || "0分",
            count: Number(bucket.count) || 0,
            show: seconds > 0,
        };
    }).filter((row) => row.show);
}

function buildStatusTags(status) {
    const tags = [];
    if (status.work_open) tags.push(`${status.work_open}中`);
    if (status.toilet_out) tags.push("上厕所中");
    if (status.meeting_out) tags.push("开会中");
    if (status.meal_open) tags.push(`${status.meal_open}中`);
    if (status.sleep_open) {
        const map = { 午睡: "午睡中", 晚上: "就寝中", 零星: "零星睡觉中" };
        tags.push(map[status.sleep_open] || "睡觉中");
    }
    if (status.transport_open) tags.push(`${status.transport_open}中`);
    if (status.activity_open) tags.push(`${status.activity_open}中`);
    if (status.custom_open) tags.push(`${status.custom_open}中`);
    return tags;
}

function buildSleepLines(detail) {
    const sleep = detail?.sleep || {};
    const lines = [];
    const nap = sleep.nap || {};
    const night = sleep.night || {};
    const sporadic = sleep.sporadic || {};
    if (Number(nap.seconds) > 0 || (nap.segments && nap.segments.length)) {
        const seg = (nap.segments || [])[0];
        lines.push({
            key: "nap",
            name: "午睡",
            text: nap.text || "0分",
            range: seg ? `${seg.start_clock} - ${seg.end_clock}` : "",
        });
    }
    if (Number(night.seconds) > 0 || (night.segments && night.segments.length)) {
        const seg = (night.segments || [])[0];
        lines.push({
            key: "night",
            name: "就寝",
            text: night.text || "0分",
            range: seg ? `${seg.start_clock} - ${seg.end_clock}` : "",
        });
    }
    if (Number(sporadic.seconds) > 0 || Number(sporadic.count) > 0) {
        lines.push({
            key: "sporadic",
            name: "零星睡觉",
            text: `${sporadic.count || 0}次 · ${sporadic.text || "0分"}`,
            range: "",
        });
    }
    return lines;
}

function buildSegmentLines(segments) {
    const list = Array.isArray(segments) ? segments : [];
    return list.map((item, index) => ({
        key: `${item.start_time || index}`,
        name: item.name || "",
        text: item.text || "0分",
        range: `${item.start_clock || ""} - ${item.end_clock || ""}`,
    }));
}

function buildCustomLines(customs) {
    const list = Array.isArray(customs) ? customs : [];
    return list
        .filter((item) => item && item.label && !PRESET_BLOCK_NAMES.has(item.label))
        .map((item) => ({
            key: item.label,
            name: item.label,
            text: `${item.count || 0}次 · ${item.text || "0分"}`,
            range: "",
        }));
}

function buildOverviewRows(stats, detail, workLines, mealLines, sleepLines, transportLines, activityLines, customLines) {
    const rows = [
        {
            key: "work",
            name: "上班",
            mark: "班",
            tone: "work",
            primary: stats.work_text || "0分",
            meta: "",
            hasDetail: workLines.length > 0,
            show: true,
        },
        {
            key: "meal",
            name: "吃饭",
            mark: "饭",
            tone: "meal",
            primary: stats.meal_text || "0分",
            meta: `${stats.meal_count || 0}次`,
            hasDetail: mealLines.length > 0,
            show: true,
        },
        {
            key: "sleep",
            name: "睡觉",
            mark: "睡",
            tone: "sleep",
            primary: stats.sleep_text || "0分",
            meta: "",
            hasDetail: sleepLines.length > 0,
            show: true,
        },
        {
            key: "toilet",
            name: "如厕",
            mark: "厕",
            tone: "toilet",
            primary: `${stats.toilet_count || 0}次`,
            meta: stats.toilet_text || "0分",
            hasDetail: (detail?.toilet?.segments || []).length > 0,
            show: true,
        },
        {
            key: "meeting",
            name: "开会",
            mark: "会",
            tone: "meeting",
            primary: `${stats.meeting_count || 0}次`,
            meta: stats.meeting_text || "0分",
            hasDetail: (detail?.meeting?.segments || []).length > 0,
            show: Number(stats.meeting_seconds) > 0 || (detail?.meeting?.segments || []).length > 0,
        },
        {
            key: "transport",
            name: "交通",
            mark: "行",
            tone: "transport",
            primary: stats.transport_text || "0分",
            meta: "",
            hasDetail: transportLines.length > 0,
            show: Number(stats.transport_seconds) > 0 || transportLines.length > 0,
        },
        {
            key: "activity",
            name: "活动",
            mark: "动",
            tone: "activity",
            primary: stats.activity_text || "0分",
            meta: "",
            hasDetail: activityLines.length > 0,
            show: Number(stats.activity_seconds) > 0 || activityLines.length > 0,
        },
        {
            key: "other",
            name: "其它",
            mark: "它",
            tone: "other",
            primary: customLines.length ? `${customLines.length}项` : "0项",
            meta: "",
            hasDetail: customLines.length > 0,
            show: customLines.length > 0,
        },
    ];
    return rows.filter((row) => row.show);
}

function applyToday(payload = {}) {
    const stats = { ...emptyStats(), ...(payload.stats || {}) };
    const status = { ...emptyStatus(), ...(payload.status || {}) };
    const detail = payload.detail || emptyDetail();
    const segments = Array.isArray(payload.segments) ? payload.segments : [];
    const events = Array.isArray(payload.events)
        ? payload.events.map((item) => ({
            ...item,
            displayLabel: item.display_label || item.label,
        }))
        : [];

    const workOpen = status.work_open || "";
    const mealOpen = status.meal_open || "";
    const sleepOpen = status.sleep_open || "";
    const transportOpen = status.transport_open || "";
    const activityOpen = status.activity_open || "";
    const customOpen = status.custom_open || "";

    const workLines = buildWorkLines(detail);
    const mealLines = buildMealLines(detail);
    const sleepLines = buildSleepLines(detail);
    const transportLines = buildTransportLines(detail);
    const activityLines = buildActivityLines(detail);
    const customLines = buildCustomLines(stats.customs);

    return {
        day: payload.day || "",
        stats,
        status,
        detail,
        segments,
        events,
        eventCount: Number(payload.event_count) || events.length,
        customActions: mapCustomActions(payload.custom_actions, customOpen),
        workActions: mapTypedActions(WORK_TYPES, workOpen),
        mealActions: mapTypedActions(MEAL_TYPES, mealOpen),
        sleepActions: mapTypedActions(SLEEP_TYPES, sleepOpen),
        transportActions: mapTypedActions(TRANSPORT_TYPES, transportOpen),
        dailyActions: mapTypedActions(DAILY_TYPES, activityOpen),
        sportActions: mapTypedActions(SPORT_TYPES, activityOpen),
        toiletBtnLabel: status.toilet_out ? "上厕所回来" : "上厕所",
        meetingBtnLabel: status.meeting_out ? "结束开会" : "开会",
        customOpenLabel: customOpen,
        statusTags: buildStatusTags(status),
        workLines,
        mealLines,
        sleepLines,
        transportLines,
        activityLines,
        customLines,
        overviewRows: buildOverviewRows(
            stats,
            detail,
            workLines,
            mealLines,
            sleepLines,
            transportLines,
            activityLines,
            customLines
        ),
    };
}

Page({
    data: {
        contentHeight: 600,
        affiliation: 0,
        userName: "",
        loading: true,
        adding: false,
        day: "",
        stats: emptyStats(),
        status: emptyStatus(),
        detail: emptyDetail(),
        segments: [],
        events: [],
        eventCount: 0,
        showEventLog: false,
        customActions: [],
        workActions: mapTypedActions(WORK_TYPES, ""),
        mealActions: mapTypedActions(MEAL_TYPES, ""),
        sleepActions: mapTypedActions(SLEEP_TYPES, ""),
        transportActions: mapTypedActions(TRANSPORT_TYPES, ""),
        dailyActions: mapTypedActions(DAILY_TYPES, ""),
        sportActions: mapTypedActions(SPORT_TYPES, ""),
        toiletBtnLabel: "上厕所",
        meetingBtnLabel: "开会",
        customOpenLabel: "",
        statusTags: [],
        overviewRows: [],
        workLines: [],
        mealLines: [],
        sleepLines: [],
        transportLines: [],
        activityLines: [],
        customLines: [],
        showCustomInput: false,
        customLabel: "",
        showDetailModal: false,
        detailModalTitle: "",
        detailModalLines: [],
    },

    onLoad() {
        this._ready = false;
        this.setData({ contentHeight: computeContentHeight() });
        this._ready = true;
    },

    async onShow() {
        const ok = await ensureStaffPage();
        if (!ok) return;
        wx.setNavigationBarColor({
            frontColor: "#000000",
            backgroundColor: "#ffffff",
        });
        await MX.waitLnnxReady();
        const affiliation = MX.selfAffiliation();
        if (!affiliation) {
            this.setData({ loading: false, affiliation: 0, userName: "" });
            wx.showToast({ title: "用户归属无效", icon: "none" });
            return;
        }
        this.setData({
            affiliation,
            userName: MX.selfAffiliationName(),
        });
        if (this._ready) {
            this.loadToday();
        }
    },

    onPullDownRefresh() {
        if (!this.data.affiliation) {
            wx.stopPullDownRefresh();
            return;
        }
        this.loadToday().finally(() => wx.stopPullDownRefresh());
    },

    async loadToday() {
        const { affiliation } = this.data;
        if (!affiliation) return;
        this.setData({ loading: true });
        try {
            const data = await MX.get("time/today", { affiliation });
            this.setData({
                ...applyToday(data),
                loading: false,
            });
        } catch (e) {
            this.setData({ loading: false });
        }
    },

    async record(action, phase, label = "") {
        if (this.data.adding) return;
        const { affiliation } = this.data;
        if (!affiliation) return;

        this.setData({ adding: true });
        try {
            const body = { affiliation, action, phase };
            if (label) body.label = label;
            const data = await MX.post("time/add", body);
            this.setData({
                ...applyToday(data),
                adding: false,
                showCustomInput: false,
                customLabel: "",
            });
            const added = data.added || {};
            const autoClosed = Array.isArray(data.auto_closed) ? data.auto_closed : [];
            let tip = added.display_label || added.label || (phase === "start" ? "已开始" : "已结束");
            if (autoClosed.length) {
                const names = autoClosed.map((item) => item.display_label || item.label).filter(Boolean);
                if (names.length) tip = `${names.join("、")}，${tip}`;
            }
            wx.showToast({ title: tip, icon: "none", duration: 2000 });
        } catch (e) {
            this.setData({ adding: false });
        }
    },

    handleWorkTap(e) {
        const type = e.currentTarget.dataset.type;
        if (!type) return;
        const open = this.data.status.work_open || "";
        const phase = open === type ? "end" : "start";
        this.record("work", phase, type);
    },

    handleToilet() {
        const phase = this.data.status.toilet_out ? "end" : "start";
        this.record("toilet", phase);
    },

    handleMeeting() {
        const phase = this.data.status.meeting_out ? "end" : "start";
        this.record("meeting", phase);
    },

    handleMealTap(e) {
        const type = e.currentTarget.dataset.type;
        if (!type) return;
        const open = this.data.status.meal_open || "";
        const phase = open === type ? "end" : "start";
        this.record("meal", phase, type);
    },

    handleSleepTap(e) {
        const type = e.currentTarget.dataset.type;
        if (!type) return;
        const def = SLEEP_TYPES.find((item) => item.key === type);
        if (def && def.instant) {
            this.record("sleep", "start", type);
            return;
        }
        const open = this.data.status.sleep_open || "";
        const phase = open === type ? "end" : "start";
        this.record("sleep", phase, type);
    },

    handleTransportTap(e) {
        const type = e.currentTarget.dataset.type;
        if (!type) return;
        const open = this.data.status.transport_open || "";
        const phase = open === type ? "end" : "start";
        this.record("transport", phase, type);
    },

    handleActivityTap(e) {
        const type = e.currentTarget.dataset.type;
        if (!type) return;
        const open = this.data.status.activity_open || "";
        const phase = open === type ? "end" : "start";
        this.record("activity", phase, type);
    },

    handleCustomTap(e) {
        const label = e.currentTarget.dataset.label;
        if (!label) return;
        const open = this.data.status.custom_open || "";
        const phase = open === label ? "end" : "start";
        this.record("custom", phase, label);
    },

    handleCustomEndOpen() {
        const label = this.data.status.custom_open;
        if (!label) return;
        this.record("custom", "end", label);
    },

    handleOverviewTap(e) {
        const key = e.currentTarget.dataset.key;
        if (!key) return;
        const {
            detail,
            workLines,
            mealLines,
            sleepLines,
            transportLines,
            activityLines,
            customLines,
            overviewRows,
        } = this.data;
        const row = (overviewRows || []).find((item) => item.key === key);
        if (!row || !row.hasDetail) return;

        let lines = [];
        if (key === "work") {
            lines = workLines.map((item) => ({
                key: item.key,
                name: item.name,
                text: item.text,
                range: item.range,
            }));
        } else if (key === "toilet") {
            lines = buildSegmentLines(detail?.toilet?.segments);
        } else if (key === "meeting") {
            lines = buildSegmentLines(detail?.meeting?.segments);
        } else if (key === "meal") {
            lines = mealLines.map((item) => ({
                key: item.key,
                name: item.name,
                text: item.text,
                range: item.range,
            }));
        } else if (key === "sleep") {
            lines = sleepLines;
        } else if (key === "transport") {
            lines = transportLines.map((item) => ({
                key: item.key,
                name: item.name,
                text: `${item.count || 0}次 · ${item.text}`,
                range: "",
            }));
        } else if (key === "activity") {
            lines = activityLines.map((item) => ({
                key: item.key,
                name: item.name,
                text: `${item.count || 0}次 · ${item.text}`,
                range: "",
            }));
        } else if (key === "other") {
            lines = customLines;
        }

        this.setData({
            showDetailModal: true,
            detailModalTitle: row.name,
            detailModalLines: lines,
        });
    },

    handleCloseDetailModal() {
        this.setData({
            showDetailModal: false,
            detailModalTitle: "",
            detailModalLines: [],
        });
    },

    noop() {},

    handleShowCustomInput() {
        this.setData({ showCustomInput: true, customLabel: "" });
    },

    handleHideCustomInput() {
        this.setData({ showCustomInput: false, customLabel: "" });
    },

    handleCustomInput(e) {
        this.setData({ customLabel: String(e.detail.value || "") });
    },

    handleCustomStart() {
        const label = String(this.data.customLabel || "").trim();
        if (!label) {
            wx.showToast({ title: "请输入行为名称", icon: "none" });
            return;
        }
        if (label.length > 32) {
            wx.showToast({ title: "名称不超过32字", icon: "none" });
            return;
        }
        this.record("custom", "start", label);
    },

    handleToggleEventLog() {
        this.setData({ showEventLog: !this.data.showEventLog });
    },

    async handleUndo() {
        if (this.data.adding || !this.data.eventCount) return;
        const { affiliation } = this.data;
        this.setData({ adding: true });
        try {
            const data = await MX.post("time/undo", { affiliation });
            this.setData({
                ...applyToday(data),
                adding: false,
            });
            wx.showToast({ title: "已撤销", icon: "none" });
        } catch (e) {
            this.setData({ adding: false });
        }
    },

    handleStats() {
        MX.go("/pages/time/stats/index");
    },
});
