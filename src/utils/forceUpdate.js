/**
 * @file 版本强制更新
 */
import config from "../config/config";
import { compareVersion } from "./system";
import request from "./request";

/**
 * 检查是否需要强制更新
 * 接口约定：返回 { minVersion, force, message, downloadUrl? }
 * 未配置 FORCE_UPDATE_URL 时直接跳过
 * @returns {Promise<{ needUpdate: boolean, force?: boolean, payload?: object, error?: * }>}
 */
const checkForceUpdate = async () => {
    if (!config.FORCE_UPDATE_URL) {
        return { needUpdate: false };
    }

    try {
        const data = await request({
            url: config.FORCE_UPDATE_URL,
            method: "GET",
            silent: true,
            isfail: true,
            dedupe: false,
        });
        const payload = data.data || data;
        const minVersion = payload.minVersion || payload.min_version;
        if (!minVersion) return { needUpdate: false };

        const local = (config.VERSION || "").split(".").slice(0, 3).join(".");
        const needUpdate = compareVersion(local, minVersion) < 0;
        if (!needUpdate) return { needUpdate: false, payload };

        return new Promise((resolve) => {
            wx.showModal({
                title: "版本更新",
                content: payload.message || "当前版本过低，请更新至最新版本",
                showCancel: !payload.force,
                confirmText: "确定",
                success: (res) => {
                    if (res.confirm && payload.downloadUrl) {
                        // 小程序内一般引导重新进入或打开客服；此处预留
                    }
                    resolve({ needUpdate: true, force: !!payload.force, payload });
                },
            });
        });
    } catch (e) {
        return { needUpdate: false, error: e };
    }
};

export { checkForceUpdate };
export default { checkForceUpdate };
