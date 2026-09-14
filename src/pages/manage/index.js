import MX from "@utils/index";
import { getTabMenus, ensureStaffPage } from "../tabbar/menus";

Page({
    data: {
        menus: [],
        entries: [
            {
                path: "/pages/goods/index",
                mark: "物",
                tone: "goods",
                title: "物品管理",
                desc: "按名称、分类、位置或归属人查找物品",
            },
            {
                path: "/pages/food/manage/index",
                mark: "食",
                tone: "food",
                title: "食品管理",
                desc: "食品查询与过期食品查看",
            },
            {
                path: "/pages/medication/manage/index",
                mark: "药",
                tone: "med",
                title: "药品管理",
                desc: "药品查询与过期药品查看",
            },
            {
                path: "/pages/clothes/manage/index",
                mark: "衣",
                tone: "clothes",
                title: "衣服鞋裤",
                desc: "衣物查询与按季节查看",
            },
            {
                path: "/pages/relation/index",
                mark: "人",
                tone: "people",
                title: "人事管理",
                desc: "查询人事关系，支持编辑详情",
            },
            {
                path: "/pages/diary/index",
                mark: "记",
                tone: "diary",
                title: "日记查询",
                desc: "按日期或内容关键字查找日记",
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
