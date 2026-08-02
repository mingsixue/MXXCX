import MX from "@utils/index";
Page({
    data: {
        menus: [
            { name: "列表示例", path: "/packageDemo/list/index" },
            { name: "表单示例", path: "/packageDemo/form/index" },
            { name: "个人中心", path: "/packageDemo/my/index" },
        ],
    },
    handleGo(e) {
        MX.go(e.currentTarget.dataset.path);
    },
});
