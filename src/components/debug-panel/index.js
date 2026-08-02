import config from "../../config/config";
import store from "@utils/store";
import { getRequestLogs, clearRequestLogs } from "@utils/request";
import { getCurrentPageInfo } from "@utils/page";
import { getSafeArea, getSystemInfo } from "@utils/system";
import { formatDate } from "@utils/date";
import {
    getEnvGroups,
    getSelectedEnv,
    initRuntimeEnv,
    setSelectedEnv,
} from "@utils/env";
import MX from "@utils/index";

const DOT_POS_KEY = "_debug_dot_pos";
const DRAG_THRESHOLD = 6;

const stringifyCacheValue = (value) => {
    if (value === undefined) return "undefined";
    if (value === null) return "null";
    if (typeof value === "string") return value;
    try {
        return JSON.stringify(value);
    } catch (e) {
        return String(value);
    }
};

Component({
    data: {
        enabled: false,
        open: false,
        tab: "main",
        version: "",
        packEnv: "",
        envType: "test",
        envLabel: "",
        envName: "",
        apiHost: "",
        envCookie: "",
        envGroups: [],
        path: "",
        query: "",
        logs: [],
        storageItems: [],
        systemText: "",
        tabs: [
            { key: "main", name: "主面板" },
            { key: "req", name: "请求" },
            { key: "store", name: "缓存" },
            { key: "system", name: "系统" },
        ],
        actionGroups: [
            {
                title: "工具",
                list: [
                    { key: "openMini", name: "跳转页面" },
                    { key: "openH5", name: "跳转 H5" },
                    { key: "scanCode", name: "扫一扫" },
                    { key: "hideDot", name: "关闭小绿点", danger: true },
                ],
            },
        ],
        dotStyle: "",
        dotMoving: false,
        dotX: 0,
        dotY: 0,
    },

    lifetimes: {
        attached() {
            this.syncEnabled();
            this.setData({
                version: config.VERSION,
                packEnv: config.ENV,
            });
            this.syncEnvView();
            this.refreshPath();
            this.initDotPosition();
        },
    },

    pageLifetimes: {
        show() {
            this.syncEnabled();
            this.refreshPath();
            this.syncEnvView();
            this.refreshWindowSize();
            this.applyDotPosition(this.data.dotX, this.data.dotY, false);
        },
    },

    methods: {
        /** 以 globalData.debugVisible 为准（启动时由 ENABLE_DEBUG 初始化） */
        syncEnabled() {
            const app = getApp();
            const enabled = !!(app && app.globalData && app.globalData.debugVisible);
            if (enabled !== this.data.enabled) {
                this.setData({ enabled, open: enabled ? this.data.open : false });
            }
        },

        refreshWindowSize() {
            const info = getSystemInfo();
            this._winW = info.windowWidth || 375;
            this._winH = info.windowHeight || 667;
            const safe = getSafeArea();
            this._safeTop = safe.top || 0;
            this._safeBottom = safe.bottom || 0;
        },

        initDotPosition() {
            this.refreshWindowSize();
            // 约等于 36rpx x 120rpx，后续用节点尺寸校正
            this._dotW = Math.ceil((this._winW / 750) * 44);
            this._dotH = Math.ceil((this._winW / 750) * 120);
            const saved = store.getItem(DOT_POS_KEY) || {};
            let x = typeof saved.x === "number" ? saved.x : this._winW - this._dotW;
            let y =
                typeof saved.y === "number"
                    ? saved.y
                    : Math.round(this._winH * 0.55 - this._dotH / 2);
            this.applyDotPosition(x, y, false);
            setTimeout(() => this.measureDotSize(), 32);
        },

        measureDotSize() {
            this.createSelectorQuery()
                .in(this)
                .select(".dot")
                .boundingClientRect((rect) => {
                    if (!rect || !rect.width || !rect.height) return;
                    this._dotW = rect.width;
                    this._dotH = rect.height;
                    this.applyDotPosition(this.data.dotX, this.data.dotY, false);
                })
                .exec();
        },

        clampDotPosition(x, y) {
            const winW = this._winW || 375;
            const winH = this._winH || 667;
            const dotW = this._dotW || 40;
            const dotH = this._dotH || 60;
            const minX = 0;
            const maxX = Math.max(0, winW - dotW);
            const minY = this._safeTop || 0;
            const maxY = Math.max(minY, winH - dotH - (this._safeBottom || 0));
            return {
                x: Math.min(maxX, Math.max(minX, x)),
                y: Math.min(maxY, Math.max(minY, y)),
            };
        },

        applyDotPosition(x, y, persist) {
            const next = this.clampDotPosition(x, y);
            this.setData({
                dotX: next.x,
                dotY: next.y,
                dotStyle: `left:${next.x}px;top:${next.y}px;right:auto;bottom:auto;`,
            });
            if (persist) {
                store.setItem(DOT_POS_KEY, { x: next.x, y: next.y });
            }
        },

        onDotTouchStart(e) {
            if (this.data.open) return;
            const touch = (e.touches && e.touches[0]) || {};
            this._dragging = false;
            this._moved = false;
            this._startX = touch.clientX || 0;
            this._startY = touch.clientY || 0;
            this._originX = this.data.dotX;
            this._originY = this.data.dotY;
        },

        onDotTouchMove(e) {
            if (this.data.open) return;
            const touch = (e.touches && e.touches[0]) || {};
            const dx = (touch.clientX || 0) - this._startX;
            const dy = (touch.clientY || 0) - this._startY;
            if (!this._moved && Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) {
                this._moved = true;
                this._dragging = true;
                this.setData({ dotMoving: true });
            }
            if (!this._dragging) return;
            this.applyDotPosition(this._originX + dx, this._originY + dy, false);
        },

        onDotTouchEnd() {
            if (this.data.open) return;
            if (this._dragging) {
                this.applyDotPosition(this.data.dotX, this.data.dotY, true);
                this.setData({ dotMoving: false });
                this._dragging = false;
                this._moved = false;
                return;
            }
            this._moved = false;
            this.toggleOpen();
        },

        syncEnvView() {
            const env = getSelectedEnv();
            const groups = getEnvGroups();
            this.setData({
                envType: env.type || "test",
                envLabel: env.label || env.name || "-",
                envName: env.name || env.label || "-",
                apiHost: env.APIHOST || "-",
                envCookie: env.cookie || "-",
                envGroups: groups.map((g) => ({
                    type: g.type,
                    label: g.label,
                    name: g.name,
                    count: g.items.length,
                })),
            });
        },

        refreshPath() {
            const info = getCurrentPageInfo();
            const options = info.options || {};
            const keys = Object.keys(options);
            const query = keys.length
                ? keys.map((k) => `${k}=${options[k]}`).join("&")
                : "-";
            this.setData({
                path: info.route || "",
                query,
            });
        },

        toggleOpen() {
            if (this._dragging || this._moved) return;
            const open = !this.data.open;
            this.setData({ open });
            if (open) this.refreshAll();
        },

        closePanel() {
            this.setData({ open: false });
        },

        hideDot() {
            const app = getApp();
            if (app) app.globalData.debugVisible = false;
            this.setData({ enabled: false, open: false });
        },

        switchTab(e) {
            this.setData({ tab: e.currentTarget.dataset.tab });
            this.refreshAll();
        },

        buildStorageItems() {
            const info = store.info() || {};
            return (info.keys || []).map((key) => {
                const item = store.inspect(key);
                let expireText = "永久";
                if (item.expireAt > 0) {
                    expireText = item.expired
                        ? "已过期"
                        : formatDate(item.expireAt * 1000, "yyyy-MM-dd HH:mm:ss");
                }
                const valueText = stringifyCacheValue(item.value);
                return {
                    key,
                    valueText,
                    valuePreview:
                        valueText.length > 120
                            ? `${valueText.slice(0, 120)}…`
                            : valueText,
                    expireText,
                    expired: !!item.expired,
                };
            });
        },

        refreshAll() {
            this.refreshPath();
            this.syncEnvView();
            this.setData({
                logs: getRequestLogs(),
                storageItems: this.buildStorageItems(),
                systemText: JSON.stringify(getSystemInfo(), null, 2),
                version: config.VERSION,
                packEnv: config.ENV,
            });
        },

        handleAction(e) {
            const { key } = e.currentTarget.dataset;
            if (key && typeof this[key] === "function") {
                this[key]();
            }
        },

        copyPath() {
            const { path } = this.data;
            if (!path) {
                wx.showToast({ title: "当前无路径", icon: "none" });
                return;
            }
            wx.setClipboardData({ data: path });
        },

        copyQuery() {
            const { query } = this.data;
            if (!query || query === "-") {
                wx.showToast({ title: "当前无路径参数", icon: "none" });
                return;
            }
            wx.setClipboardData({ data: query });
        },

        copyStorage() {
            const info = store.info() || {};
            const data = {};
            (info.keys || []).forEach((k) => {
                data[k] = store.getItem(k);
            });
            wx.setClipboardData({ data: JSON.stringify(data) });
        },

        clearStorage() {
            store.clear();
            wx.showToast({ title: "缓存已清除", icon: "none" });
            this.refreshAll();
        },

        openH5() {
            wx.showModal({
                title: "跳转 H5",
                editable: true,
                placeholderText: "https://...",
                success: (res) => {
                    if (res.confirm && res.content) {
                        MX.openWebview(res.content);
                    }
                },
            });
        },

        openMini() {
            wx.showModal({
                title: "跳转小程序路径",
                editable: true,
                placeholderText: "/pages/index/index",
                success: (res) => {
                    if (res.confirm && res.content) {
                        MX.go(res.content);
                    }
                },
            });
        },

        scanCode() {
            wx.scanCode({
                success: (res) => {
                    wx.showModal({
                        title: "扫码结果",
                        content: res.result || "",
                        showCancel: false,
                    });
                },
            });
        },

        showSystem() {
            this.setData({ tab: "system" });
            this.refreshAll();
        },

        copyLogItem(e) {
            const { index } = e.currentTarget.dataset;
            const item = this.data.logs[index];
            wx.setClipboardData({ data: JSON.stringify(item, null, 2) });
        },

        clearLogs() {
            clearRequestLogs();
            this.setData({ logs: [] });
        },

        removeStorageKey(e) {
            const { key } = e.currentTarget.dataset;
            store.remove(key);
            this.refreshAll();
        },

        onStorageItemTap(e) {
            const { key } = e.currentTarget.dataset;
            if (!key) return;
            wx.showActionSheet({
                itemList: ["复制", "修改"],
                success: (res) => {
                    if (res.tapIndex === 0) this.copyStorageKey(key);
                    if (res.tapIndex === 1) this.editStorageKey(key);
                },
            });
        },

        copyStorageKey(key) {
            const item = store.inspect(key);
            wx.setClipboardData({
                data: JSON.stringify(
                    {
                        key,
                        value: item.value,
                        expireAt: item.expireAt || null,
                        expired: item.expired,
                    },
                    null,
                    2
                ),
            });
        },

        editStorageKey(key) {
            const item = store.inspect(key);
            const valueText = stringifyCacheValue(item.value);
            wx.showModal({
                title: `修改 ${key}`,
                editable: true,
                placeholderText: "请输入缓存值",
                content: valueText === "undefined" ? "" : valueText,
                success: (res) => {
                    if (!res.confirm) return;
                    let nextValue = res.content;
                    if (nextValue === undefined || nextValue === null) {
                        nextValue = "";
                    }
                    try {
                        nextValue = JSON.parse(nextValue);
                    } catch (e) {
                        // 保持字符串
                    }
                    try {
                        if (item.expireAt > 0) {
                            wx.setStorageSync(key, {
                                _v: nextValue,
                                _t: item.expireAt,
                            });
                        } else {
                            store.setItem(key, nextValue);
                        }
                    } catch (e) {
                        wx.showToast({ title: "保存失败", icon: "none" });
                        return;
                    }
                    if (key === "_env") {
                        initRuntimeEnv();
                        this.syncEnvView();
                    }
                    wx.showToast({ title: "已保存", icon: "none" });
                    this.refreshAll();
                },
            });
        },

        applyEnv(target) {
            if (!target) return;
            const current = getSelectedEnv();
            if (target.id === current.id) {
                wx.showToast({ title: "已是当前环境", icon: "none" });
                return;
            }
            setSelectedEnv(target.id);
            this.syncEnvView();
            wx.showToast({
                title: `已切到 ${target.label || target.name}`,
                icon: "none",
            });
            setTimeout(() => {
                const info = getCurrentPageInfo();
                wx.reLaunch({
                    url: info.fullPath || info.route || "/pages/index/index",
                });
            }, 400);
        },

        /** ActionSheet 选择具体环境（最多 6 项） */
        pickFromList(items) {
            if (!items || !items.length) return;
            const current = getSelectedEnv();
            const list = items.slice(0, 6);
            wx.showActionSheet({
                itemList: list.map((item) => {
                    const mark = item.id === current.id ? " ✓" : "";
                    return `${item.name || item.label || item.id}${mark}`;
                }),
                success: (res) => this.applyEnv(list[res.tapIndex]),
            });
        },

        /** 主面板：点类型芯片（测试 / 灰度 / 线上） */
        switchEnvType(e) {
            const { type } = e.currentTarget.dataset;
            const group = getEnvGroups().find((g) => g.type === type);
            if (!group) return;
            if (group.items.length === 1) {
                this.applyEnv(group.items[0]);
                return;
            }
            this.pickFromList(group.items);
        },

    },
});
