import MX from "@utils/index";

const TYPE_TEXT = { 1: "工作", 2: "生活", 3: "学习", 4: "其他" };
const PRIORITY_TEXT = { 1: "低", 2: "中", 3: "高", 4: "紧急" };
const STATUS_TEXT = { 1: "待处理", 2: "处理中", 3: "已完成", 4: "已取消" };
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

/** 统一为 YYYY-MM-DD HH:mm:ss */
function toDateTime(v) {
    if (!v) return "";
    const raw = String(v).trim();
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw} 00:00:00`;
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(raw)) return `${raw}:00`;
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(raw)) return raw;
    return raw.slice(0, 19);
}

function nowDateTime() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

Page({
    data: {
        title: "新增待办",
        isEdit: false,
        id: 0,
        loading: false,
        submitting: false,
        todoTitle: "",
        content: "",
        type: 1,
        typeIndex: 0,
        typeOptions: mapOptions(TYPE_TEXT),
        priority: 2,
        priorityIndex: 1,
        priorityOptions: mapOptions(PRIORITY_TEXT),
        status: 1,
        statusIndex: 0,
        statusOptions: mapOptions(STATUS_TEXT),
        affiliation: 1,
        affiliationIndex: 0,
        affiliationOptions: AFFILIATION,
        assignee: "",
        planStart: "",
        planEnd: "",
        doneTime: "",
        remark: "",
        datetimeVisible: false,
        datetimeField: "",
        datetimeTitle: "",
        datetimeValue: "",
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
            this.setData({
                ...base,
                id,
                isEdit: true,
                title: "编辑待办",
                loading: true,
            });
            this.loadDetail(id);
        } else {
            this.setData(base);
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
            const detail = await MX.get("todo/detail", { id });
            if (!detail || !detail.id) {
                this.setData({ loading: false });
                wx.showToast({ title: "记录不存在", icon: "none" });
                return;
            }
            if (!MX.canWriteRecord(detail)) {
                this.setData({ loading: false });
                wx.showToast({ title: "无权限编辑", icon: "none" });
                setTimeout(() => MX.back(), 500);
                return;
            }
            const type = Number(detail.type) || 1;
            const priority = Number(detail.priority) || 2;
            const status = Number(detail.status) || 1;
            let affiliation = Number(detail.affiliation) || 1;
            if (MX.isJuan()) {
                affiliation = 2;
            }
            this.setData({
                todoTitle: detail.title || "",
                content: detail.content || "",
                type,
                typeIndex: findIndex(this.data.typeOptions, type),
                priority,
                priorityIndex: findIndex(this.data.priorityOptions, priority, 1),
                status,
                statusIndex: findIndex(this.data.statusOptions, status),
                affiliation,
                affiliationIndex: findIndex(this.data.affiliationOptions, affiliation),
                assignee: detail.assignee || "",
                planStart: toDateTime(detail.plan_start_time),
                planEnd: toDateTime(detail.plan_end_time),
                doneTime: toDateTime(detail.done_time),
                remark: detail.remark || "",
                loading: false,
            });
        } catch (e) {
            this.setData({ loading: false });
        }
    },

    onTitleChange(e) {
        this.setData({ todoTitle: (e.detail && e.detail.value) || "" });
    },

    onContentChange(e) {
        this.setData({ content: (e.detail && e.detail.value) || "" });
    },

    onAssigneeChange(e) {
        this.setData({ assignee: (e.detail && e.detail.value) || "" });
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

    onPriorityChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const priorityIndex = Number(e.detail.value) || 0;
        const opt = this.data.priorityOptions[priorityIndex];
        this.setData({ priorityIndex, priority: opt ? opt.value : 2 });
    },

    onStatusChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const statusIndex = Number(e.detail.value) || 0;
        const opt = this.data.statusOptions[statusIndex];
        this.setData({ statusIndex, status: opt ? opt.value : 1 });
    },

    onAffiliationChange(e) {
        if (!(e.detail && e.detail.type === "selector")) return;
        const affiliationIndex = Number(e.detail.value) || 0;
        const opt = this.data.affiliationOptions[affiliationIndex];
        this.setData({ affiliationIndex, affiliation: opt ? opt.value : 1 });
    },

    openDatetime(e) {
        const { field, title } = e.currentTarget.dataset;
        if (!field) return;
        const current = this.data[field] || "";
        this.setData({
            datetimeField: field,
            datetimeTitle: title || "选择时间",
            datetimeValue: current || nowDateTime(),
            datetimeVisible: true,
        });
    },

    handleDatetimeConfirm(e) {
        const value = toDateTime((e.detail && e.detail.value) || "");
        const field = this.data.datetimeField;
        if (!field) {
            this.setData({ datetimeVisible: false });
            return;
        }
        this.setData({
            [field]: value,
            datetimeVisible: false,
            datetimeField: "",
        });
    },

    handleDatetimeClose() {
        this.setData({ datetimeVisible: false, datetimeField: "" });
    },

    clearDatetime(e) {
        const { field } = e.currentTarget.dataset;
        if (!field) return;
        this.setData({ [field]: "" });
    },

    async handleSubmit() {
        if (this.data.submitting) return;
        const todoTitle = (this.data.todoTitle || "").trim();
        const content = (this.data.content || "").trim();
        if (!todoTitle) {
            wx.showToast({ title: "请填写标题", icon: "none" });
            return;
        }
        if (!content) {
            wx.showToast({ title: "请填写内容", icon: "none" });
            return;
        }

        const payload = {
            title: todoTitle,
            content,
            type: this.data.type,
            priority: this.data.priority,
            status: this.data.status,
            affiliation: MX.isJuan() ? 2 : this.data.affiliation,
            assignee: (this.data.assignee || "").trim(),
            remark: (this.data.remark || "").trim(),
            plan_start_time: toDateTime(this.data.planStart),
            plan_end_time: toDateTime(this.data.planEnd),
            done_time: toDateTime(this.data.doneTime),
        };

        this.setData({ submitting: true });
        try {
            if (this.data.isEdit) {
                await MX.post("todo/edit", { ...payload, id: this.data.id });
                wx.showToast({ title: "保存成功", icon: "success" });
            } else {
                await MX.post("todo/add", payload);
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
