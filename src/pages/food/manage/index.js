import MX from "@utils/index";
import { ensureStaffPage } from "../../tabbar/menus";

const ALL_ENTRIES = [
    {
        path: "/pages/food/form/index",
        mark: "增",
        title: "新增食品",
        desc: "录入一件新食品",
        expired: false,
        writeOnly: true,
    },
    {
        path: "/pages/food/index",
        mark: "查",
        title: "食品查询",
        desc: "按分类或名称查找食品",
        expired: false,
    },
    {
        path: "/pages/food/expired/index",
        mark: "期",
        title: "过期食品",
        desc: "按到期时间查看过期食品",
        expired: true,
    },
];

Page({
    data: {
        entries: [],
    },

    async onShow() {
        const ok = await ensureStaffPage();
        if (!ok) return;
        const canAdd = MX.canAddShared();
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
