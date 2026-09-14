import MX from "@utils/index";
import { ensureStaffPage } from "../../tabbar/menus";

const ALL_ENTRIES = [
    {
        path: "/pages/medication/form/index",
        mark: "增",
        title: "新增药品",
        desc: "录入一件新药品",
        expired: false,
        writeOnly: true,
    },
    {
        path: "/pages/medication/index",
        mark: "查",
        title: "药品查询",
        desc: "按分类或名称查找药品",
        expired: false,
    },
    {
        path: "/pages/medication/expired/index",
        mark: "期",
        title: "过期药品",
        desc: "按到期时间查看过期药品",
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
