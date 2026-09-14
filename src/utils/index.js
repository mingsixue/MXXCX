/**
 * @file 工具聚合导出（MX）
 * @example
 * import MX from '@utils/index';
 * MX.formatDate(Date.now(), 'yyyy-MM-dd');
 * MX.go('/packageDemo/list/index');
 * MX.post('/api/demo', { id: 1 });
 */
import store from "./store";
import request, { get, post, getRequestLogs, clearRequestLogs } from "./request";
import user from "./user";
import upload, {
    chooseAndUploadImage,
    chooseAndUploadVideo,
    chooseAndUploadFile,
    uploadFileToOss,
} from "./upload";
import { chooseAndUploadLnnxImage } from "./lnnxUpload";
import { ensureLnnxLogin, getLastDeniedOpenid, loginByCode } from "./lnnxAuth";
import lnnxPermission from "./lnnxPermission";
import auth from "./auth";
import navigate from "./navigate";
import date from "./date";
import number from "./number";
import string from "./string";
import validate from "./validate";
import system from "./system";
import page from "./page";
import { debounce, throttle } from "./debounce";
import pay from "./pay";
import subscribe from "./subscribe";
import report from "./report";
import md5 from "./md5";
import base64 from "./base64";
import lottie from "./lottie";
import { checkForceUpdate } from "./forceUpdate";
import env from "./env";

/** @type {object} 框架公共方法集合 */
const MX = {
    /** @see store.js */
    store,
    setStore: store.setItem.bind(store),
    getStore: store.getItem.bind(store),
    updateStore: store.update.bind(store),
    removeStore: store.remove.bind(store),
    clearStore: store.clear.bind(store),

    /** @see request.js */
    request,
    get,
    post,
    getRequestLogs,
    clearRequestLogs,

    /** @see user.js */
    ...user,

    /** @see upload.js / lnnxUpload.js */
    upload,
    chooseAndUploadImage,
    chooseAndUploadVideo,
    chooseAndUploadFile,
    uploadFileToOss,
    chooseAndUploadLnnxImage,

    /** @see lnnxAuth.js */
    ensureLnnxLogin,
    getLastDeniedOpenid,
    loginByCode,

    /** @see lnnxPermission.js */
    ...lnnxPermission,

    /** @see auth.js / navigate.js */
    ...auth,
    ...navigate,

    /** @see date.js / number.js / string.js / validate.js */
    ...date,
    ...number,
    ...string,
    ...validate,

    /** @see system.js / page.js */
    ...system,
    ...page,

    debounce,
    throttle,

    /** 子模块：pay / subscribe / report / md5 / base64 / lottie / env */
    pay,
    subscribe,
    report,
    md5,
    base64,
    lottie,
    env,
    checkForceUpdate,
    getApiHost: env.getApiHost,
    getH5Host: env.getH5Host,
    getEnvCookie: env.getEnvCookie,
    getSelectedEnv: env.getSelectedEnv,
    setSelectedEnv: env.setSelectedEnv,
    getEnvList: env.getEnvList,

    /** 别名 */
    getNavHeight: system.getNavBarHeight,
    getNumberAccuracy: number.getNumberAccuracy,
};

export default MX;
