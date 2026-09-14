import MX from "@utils/index";
import { getTabMenus, ensureStaffPage } from "../tabbar/menus";

Page({
    data: {
        menus: [],
        entries: [
            {
                path: "/pages/water/index",
                mark: "水",
                eyebrow: "HYDRATE",
                title: "喝水记录",
                desc: "记录每日饮水",
            },
            {
                path: "/pages/meal/index",
                mark: "餐",
                eyebrow: "MEAL",
                title: "一日三餐",
                desc: "记录每日饮食",
            },
            {
                path: "/pages/time/index",
                mark: "时",
                eyebrow: "FOCUS",
                title: "时间记录",
                desc: "记录时间事件",
            },
            {
                path: "/pages/todo/index",
                mark: "办",
                eyebrow: "TODO",
                title: "待办清单",
                desc: "跟踪待办与进度",
            },
            {
                path: "/pages/renewal/index",
                mark: "续",
                eyebrow: "RENEW",
                title: "续费提醒",
                desc: "关注到期与续费",
            },
        ],
    },

    async onShow() {
        const ok = await ensureStaffPage();
        if (!ok) return;
        this.setData({ menus: getTabMenus() });
    },

    handleEntry(e) {
        const { path } = e.currentTarget.dataset;
        if (!path) return;
        MX.go(path);
    },
});
