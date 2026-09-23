import store from "@utils/store";
import config from "./config/config";
import { checkForceUpdate } from "@utils/forceUpdate";
import { captureError } from "@utils/report";
import { initRuntimeEnv } from "@utils/env";

App({
    onLaunch() {
        this.init();
        this.checkUpdate();
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
    async checkUpdate() {
        try {
            await checkForceUpdate();
        } catch (e) {
            // ignore
        }
    },
});
