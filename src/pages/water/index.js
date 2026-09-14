import MX from "@utils/index";
import { ensureStaffPage } from "../tabbar/menus";

const AMOUNTS = [50, 100, 200, 300, 500];

function computeContentHeight() {
    const info = MX.getSystemInfo ? MX.getSystemInfo() : wx.getSystemInfoSync();
    const windowHeight = info.windowHeight || 667;
    const statusBarHeight = info.statusBarHeight || 20;
    const navHeight = statusBarHeight + 46;
    return Math.max(windowHeight - navHeight, 480);
}

function buildAmountItems(selectedAmount, customMode) {
    return AMOUNTS.map((value) => ({
        value,
        label: `${value}ml`,
        on: !customMode && selectedAmount === value,
    }));
}

function applyToday(payload = {}) {
    const totalMl = Number(payload.total_ml) || 0;
    const goalMl = Number(payload.goal_ml) || 2000;
    const rawPercent = Number(payload.fill_percent);
    const fillPercent =
        Number.isFinite(rawPercent) && rawPercent >= 0
            ? Math.round(rawPercent)
            : goalMl > 0
              ? Math.round((totalMl / goalMl) * 100)
              : 0;
    return {
        totalMl,
        times: Number(payload.times) || 0,
        goalMl,
        fillPercent,
        fillHeight: `${Math.min(100, fillPercent)}%`,
        records: Array.isArray(payload.records) ? payload.records : [],
        day: payload.day || "",
    };
}

Page({
    data: {
        contentHeight: 600,
        affiliation: 0,
        amountItems: buildAmountItems(200, false),
        selectedAmount: 200,
        customMode: false,
        customAmount: "",
        totalMl: 0,
        times: 0,
        goalMl: 2000,
        fillPercent: 0,
        fillHeight: "0%",
        records: [],
        day: "",
        loading: true,
        adding: false,
        cupSplash: false,
    },

    onLoad() {
        this.setData({ contentHeight: computeContentHeight() });
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
            this.setData({ loading: false, affiliation: 0 });
            wx.showToast({ title: "用户归属无效", icon: "none" });
            return;
        }
        this.setData({
            affiliation,
        });
        this.loadToday();
    },

    onPullDownRefresh() {
        if (!this.data.affiliation) {
            wx.stopPullDownRefresh();
            return;
        }
        this.loadToday().finally(() => wx.stopPullDownRefresh());
    },

    syncAmountUi(patch = {}) {
        const selectedAmount =
            patch.selectedAmount !== undefined
                ? patch.selectedAmount
                : this.data.selectedAmount;
        const customMode =
            patch.customMode !== undefined ? patch.customMode : this.data.customMode;
        this.setData({
            ...patch,
            amountItems: buildAmountItems(selectedAmount, customMode),
        });
    },

    async loadToday() {
        const { affiliation } = this.data;
        if (!affiliation) return;
        this.setData({ loading: true });
        try {
            const data = await MX.get("water/today", { affiliation });
            this.setData({
                ...applyToday(data),
                loading: false,
            });
        } catch (e) {
            this.setData({ loading: false });
        }
    },

    handleSelectAmount(e) {
        const amount = Number(e.currentTarget.dataset.amount);
        this.syncAmountUi({
            selectedAmount: amount,
            customMode: false,
            customAmount: "",
        });
    },

    handleCustomTap() {
        this.syncAmountUi({
            customMode: true,
            selectedAmount: 0,
        });
    },

    handleCustomInput(e) {
        const val = String(e.detail.value || "").replace(/\D/g, "");
        this.syncAmountUi({ customAmount: val });
    },

    getDrinkAmount() {
        const { customMode, customAmount, selectedAmount } = this.data;
        if (customMode) {
            const n = parseInt(customAmount, 10);
            if (!n || n < 1 || n > 5000) {
                wx.showToast({ title: "请输入 1~5000 ml", icon: "none" });
                return 0;
            }
            return n;
        }
        return selectedAmount || 0;
    },

    async handleDrink() {
        if (this.data.adding) return;
        const amount = this.getDrinkAmount();
        if (!amount) return;
        const { affiliation } = this.data;
        if (!affiliation) return;

        this.setData({ adding: true, cupSplash: true });
        try {
            const data = await MX.post("water/add", {
                affiliation,
                amount_ml: amount,
            });
            this.setData({
                ...applyToday(data),
                adding: false,
            });
            wx.showToast({ title: `+${amount}ml`, icon: "none" });
        } catch (e) {
            this.setData({ adding: false });
        }
        setTimeout(() => this.setData({ cupSplash: false }), 900);
    },

    async handleUndo() {
        if (this.data.adding || !this.data.times) return;
        const { affiliation } = this.data;
        this.setData({ adding: true });
        try {
            const data = await MX.post("water/undo", { affiliation });
            this.setData({
                ...applyToday(data),
                adding: false,
            });
            wx.showToast({ title: "已撤销", icon: "none" });
        } catch (e) {
            this.setData({ adding: false });
        }
    },

    handleGoalEdit() {
        const { affiliation, goalMl } = this.data;
        wx.showModal({
            title: "每日目标",
            editable: true,
            placeholderText: "毫升",
            content: String(goalMl),
            success: async (res) => {
                if (!res.confirm) return;
                const n = parseInt(String(res.content || "").replace(/\D/g, ""), 10);
                if (!n || n < 100 || n > 10000) {
                    wx.showToast({ title: "目标 100~10000 ml", icon: "none" });
                    return;
                }
                try {
                    await MX.post("water/setting", {
                        affiliation,
                        goal_ml: n,
                    });
                    await this.loadToday();
                    wx.showToast({ title: "已更新目标", icon: "none" });
                } catch (e) {
                    // toast by request
                }
            },
        });
    },

    handleStats() {
        MX.go("/pages/water/stats/index");
    },
});
