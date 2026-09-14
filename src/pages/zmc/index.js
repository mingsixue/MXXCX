import MX from "@utils/index";
import { getTabMenus } from "../tabbar/menus";

const TYPE_LABELS = {
    1: "诗",
    2: "词",
    3: "现代诗",
    4: "曲",
};

function computeContentHeight() {
    const info = MX.getSystemInfo ? MX.getSystemInfo() : wx.getSystemInfoSync();
    const windowHeight = info.windowHeight || 667;
    const statusBarHeight = info.statusBarHeight || 20;
    const navHeight = statusBarHeight + 46;
    return Math.max(windowHeight - navHeight, 480);
}

Page({
    data: {
        menus: [],
        showTabbar: false,
        list: [],
        loading: true,
        empty: false,
        contentHeight: 600,
    },

    onLoad() {
        this.setData({ contentHeight: computeContentHeight() });
        this.loadList();
    },

    async onShow() {
        wx.setNavigationBarColor({
            frontColor: "#ffffff",
            backgroundColor: "#A02731",
        });
        try {
            const app = getApp();
            if (app && app.globalData && app.globalData.loginReady) {
                await app.globalData.loginReady;
            }
        } catch (e) {
            // ignore
        }
        const menus = getTabMenus();
        this.setData({
            menus,
            showTabbar: menus.length > 0,
        });
    },

    onPullDownRefresh() {
        this.loadList().finally(() => wx.stopPullDownRefresh());
    },

    onShareAppMessage() {
        return {
            title: "子明词年谱",
            path: "/pages/zmc/index",
        };
    },

    async loadList() {
        this.setData({ loading: true });
        try {
            const rows = await MX.get("zmc/list");
            const list = (Array.isArray(rows) ? rows : []).map((item) => ({
                ...item,
                typeStr: TYPE_LABELS[item.type] || "其他",
                dateText: String(item.date || "").replace(/-/g, "/"),
            }));
            this.setData({
                list,
                empty: list.length === 0,
                loading: false,
            });
        } catch (e) {
            this.setData({ loading: false, empty: true });
        }
    },

    handleDetail(e) {
        const { key } = e.currentTarget.dataset;
        if (!key) return;
        MX.go(`/pages/zmc/detail/index?key=${encodeURIComponent(key)}`);
    },
});
