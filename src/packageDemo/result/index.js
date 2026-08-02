import MX from "@utils/index";

Page({
    data: {
        buttons: [{ text: "返回首页", type: "primary" }],
    },
    onBtn() {
        MX.go("/pages/index/index");
    },
});
