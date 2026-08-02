import MX from "@utils/index";
import config from "../../config/config";

Page({
    data: {
        version: "",
        env: "",
        isLogin: false,
        groups: [
            {
                title: "页面模版",
                list: [
                    { name: "首页模版", path: "/packageDemo/home/index" },
                    { name: "个人中心", path: "/packageDemo/my/index" },
                    { name: "列表页", path: "/packageDemo/list/index" },
                    { name: "表单页", path: "/packageDemo/form/index" },
                    { name: "商品列表", path: "/packageDemo/goods-list/index" },
                    { name: "商品详情", path: "/packageDemo/goods/index" },
                    { name: "授权页面", path: "/packageDemo/auth/index" },
                    { name: "设置页", path: "/packageDemo/setting/index" },
                    { name: "登录页", path: "/packageDemo/login/index" },
                    { name: "结果页", path: "/packageDemo/result/index" },
                    { name: "骨架屏", path: "/packageDemo/skeleton/index" },
                    { name: "弹窗示例", path: "/packageDemo/dialog/index" },
                    { name: "底部导航", path: "/packageDemo/tabbar/home/index" },
                ],
            },
            {
                title: "基础能力",
                list: [
                    { name: "WebView / H5", path: "/packageDemo/webview/index" },
                    { name: "跳转示例", path: "/packageDemo/navigate/index" },
                    { name: "刘海屏安全区", path: "/packageDemo/safe-area/index" },
                    { name: "分包说明", path: "/packageDemo/subpackage-demo/index" },
                    { name: "支付示例", path: "/packageDemo/pay/index" },
                    { name: "订阅消息", path: "/packageDemo/subscribe/index" },
                    { name: "Lottie", path: "/packageDemo/lottie/index" },
                    { name: "错误上报", path: "/packageDemo/report/index" },
                ],
            },
        ],
    },

    onLoad() {
        this.setData({
            version: config.VERSION || "",
            env: config.ENV,
            isLogin: MX.getIsLogin(),
        });
    },

    onShow() {
        this.setData({ isLogin: MX.getIsLogin() });
    },

    handleGo(e) {
        const { path } = e.currentTarget.dataset;
        MX.go(path);
    },
});
