import store from "@utils/store";
import config from "./config/config";
import { checkForceUpdate } from "@utils/forceUpdate";
import { captureError } from "@utils/report";
import { initRuntimeEnv } from "@utils/env";
import { ensureLnnxLogin, getLastDeniedOpenid } from "@utils/lnnxAuth";

App({
    onLaunch() {
        this.init();
        this.checkUpdate();
        this.bootstrapLogin();
    },
    onShow() {},
    onHide() {},
    onError(err) {
        captureError(err, { source: "App.onError" });
    },
    globalData: {
        isLogin: false,
        user: null,
        version: "",
        env: "",
        runtimeEnv: null,
        requestLogs: [],
        debugVisible: true,
        loginReady: null,
        loginError: null,
    },
    init() {
        this.globalData.version = config.VERSION || "";
        this.globalData.env = config.ENV || "";
        this.globalData.debugVisible = !!config.ENABLE_DEBUG;
        this.globalData.runtimeEnv = initRuntimeEnv();

        const user = store.getItem("_userInfo") || {};
        if (user.token) {
            this.globalData.user = user;
            this.globalData.isLogin = true;
        } else {
            this.globalData.user = null;
            this.globalData.isLogin = false;
        }
    },
    bootstrapLogin() {
        this.globalData.loginError = null;
        this.globalData.loginReady = ensureLnnxLogin()
            .then((user) => {
                this.globalData.user = user;
                this.globalData.isLogin = true;
                this.globalData.loginError = null;
                return user;
            })
            .catch((err) => {
                this.globalData.isLogin = false;
                this.globalData.user = null;
                this.globalData.loginError = err;
                const openid = (err && err.openid) || getLastDeniedOpenid();
                if (openid) {
                    console.warn("[lnnx] 未授权 openid，请写入 mx_lnnx_user：", openid);
                }
                // 不抛出，避免后续 await loginReady 的业务请求全部中断；
                // 无 token 时受保护接口会返回 401。
                return null;
            });
    },
    async checkUpdate() {
        try {
            await checkForceUpdate();
        } catch (e) {
            // ignore
        }
    },
});
