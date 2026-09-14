import MX from "@utils/index";
import { ensureStaffPage } from "../../tabbar/menus";

const ALL_ENTRIES = [
    {
        path: "/pages/clothes/form/index",
        mark: "增",
        title: "新增衣物",
        desc: "录入一件新衣物",
        season: false,
        writeOnly: true,
    },
    {
        path: "/pages/clothes/index",
        mark: "查",
        title: "衣物查询",
        desc: "按分类或名称查找衣服鞋裤",
        season: false,
    },
    {
        path: "/pages/clothes/season/index",
        mark: "季",
        title: "按季节查看",
        desc: "按春夏秋冬查看衣物",
        season: true,
    },
    {
        path: "/pages/clothes/owner/index",
        mark: "人",
        title: "按归属人查看",
        desc: "按衣物归属人筛选查看",
        owner: true,
    },
];

Page({
    data: {
        entries: [],
    },

    async onShow() {
        const ok = await ensureStaffPage();
        if (!ok) return;
        const canAdd = MX.canAddOwned();
        this.setData({
            entries: ALL_ENTRIES.filter((e) => !e.writeOnly || canAdd),
        });
    },

    handleEntry(e) {
        const { path } = e.currentTarget.dataset;
        if (!path) return;
        MX.go(path);
    },
});
