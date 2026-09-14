import MX from "@utils/index";
import { ensureStaffPage } from "../tabbar/menus";

const ALL_ENTRIES = [
    {
        path: "/pages/goods/form/index",
        mark: "增",
        title: "新增物品",
        desc: "录入一件新物品",
        tone: "blue",
        writeOnly: true,
    },
    {
        mode: "name",
        mark: "名",
        title: "按名称查询",
        desc: "输入物品名称，快速定位物品",
        tone: "blue",
    },
    {
        mode: "category",
        mark: "类",
        title: "按分类查询",
        desc: "从物品分类中逐类查找",
        tone: "green",
    },
    {
        mode: "storage",
        mark: "位",
        title: "按存放位置查询",
        desc: "看看某个位置存放了什么",
        tone: "orange",
    },
    {
        mode: "owner",
        mark: "人",
        title: "按归属人查询",
        desc: "按物品归属人筛选查看",
        tone: "purple",
    },
];

Page({
    data: {
        entries: [],
    },

    async onShow() {
        const ok = await ensureStaffPage();
        if (!ok) return;
        wx.setNavigationBarColor({
            frontColor: "#000000",
            backgroundColor: "#f5f6f8",
        });
        const canAdd = MX.canAddOwned();
        this.setData({
            entries: ALL_ENTRIES.filter((e) => !e.writeOnly || canAdd),
        });
    },

    handleEntry(e) {
        const { mode, path } = e.currentTarget.dataset;
        if (path) {
            MX.go(path);
            return;
        }
        if (!mode) return;
        wx.navigateTo({ url: `/pages/goods/query/index?mode=${mode}` });
    },
});
