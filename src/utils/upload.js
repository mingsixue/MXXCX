/**
 * @file 上传模块：OSS 图片 / 视频 / 文件
 */
import request from "./request";
import config from "../config/config";
import { randomString } from "./string";

/**
 * 获取 OSS 临时上传凭证
 * @returns {Promise<object>}
 */
const getOssToken = () => {
    return request({
        url: "/api/v1/wx-user/ossMpToken",
        method: "GET",
    });
};

/**
 * 将本地临时文件上传至 OSS
 * @param {string} filePath 本地临时路径
 * @param {string} [scene='file'] 业务场景目录名，如 img / video / file
 * @returns {Promise<string>} 可访问的完整 URL
 */
const uploadFileToOss = (filePath, scene = "file") => {
    return getOssToken().then((oss) => {
        const prefix = config.OSSPREFIX || "upload";
        const key = `${prefix}/${scene}/${Date.now()}-${randomString(8)}`;
        return new Promise((resolve, reject) => {
            wx.uploadFile({
                url: config.OSSUPLOADHOST,
                filePath,
                name: "file",
                formData: {
                    key,
                    policy: oss.policy,
                    OSSAccessKeyId: oss.OSSAccessKeyId,
                    signature: oss.signature,
                    "x-oss-security-token": oss["x-oss-security-token"],
                },
                success: (res) => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(`${config.OSSHOST}/${key}`);
                    } else {
                        reject(res);
                    }
                },
                fail: reject,
            });
        });
    });
};

/**
 * 选择并上传图片
 * @param {object} [options]
 * @param {number} [options.count=1] 数量；为 1 时 resolve 单个 url，否则为数组
 * @param {string[]} [options.sourceType] album / camera
 * @returns {Promise<string|string[]>}
 */
const chooseAndUploadImage = (options = {}) => {
    return new Promise((resolve, reject) => {
        wx.chooseMedia({
            count: options.count || 1,
            mediaType: ["image"],
            sourceType: options.sourceType || ["album", "camera"],
            success: async (resp) => {
                try {
                    const files = resp.tempFiles || [];
                    const urls = [];
                    for (let i = 0; i < files.length; i++) {
                        urls.push(await uploadFileToOss(files[i].tempFilePath, "img"));
                    }
                    resolve(options.count === 1 ? urls[0] : urls);
                } catch (e) {
                    reject(e);
                }
            },
            fail: reject,
        });
    });
};

/**
 * 选择并上传视频
 * @param {object} [options]
 * @param {string[]} [options.sourceType]
 * @returns {Promise<string>}
 */
const chooseAndUploadVideo = (options = {}) => {
    return new Promise((resolve, reject) => {
        wx.chooseMedia({
            count: 1,
            mediaType: ["video"],
            sourceType: options.sourceType || ["album", "camera"],
            success: async (resp) => {
                try {
                    const file = (resp.tempFiles || [])[0];
                    const url = await uploadFileToOss(file.tempFilePath, "video");
                    resolve(url);
                } catch (e) {
                    reject(e);
                }
            },
            fail: reject,
        });
    });
};

/**
 * 从会话选择并上传文件
 * @param {object} [options]
 * @param {number} [options.count=1]
 * @param {string} [options.type='file'] chooseMessageFile 的 type
 * @returns {Promise<string|string[]>}
 */
const chooseAndUploadFile = (options = {}) => {
    return new Promise((resolve, reject) => {
        wx.chooseMessageFile({
            count: options.count || 1,
            type: options.type || "file",
            success: async (resp) => {
                try {
                    const files = resp.tempFiles || [];
                    const urls = [];
                    for (let i = 0; i < files.length; i++) {
                        urls.push(await uploadFileToOss(files[i].path, "file"));
                    }
                    resolve(options.count === 1 ? urls[0] : urls);
                } catch (e) {
                    reject(e);
                }
            },
            fail: reject,
        });
    });
};

/**
 * 兼容旧回调写法：选图并上传一张
 * @param {string} [_scene='img'] 场景（保留参数兼容）
 * @param {function(string): void} [success] 成功回调，参数为 url
 */
const upload = (_scene = "img", success) => {
    chooseAndUploadImage({ count: 1 })
        .then((url) => success && success(url))
        .catch((err) => console.log("=-= upload err", err));
};

export {
    getOssToken,
    uploadFileToOss,
    chooseAndUploadImage,
    chooseAndUploadVideo,
    chooseAndUploadFile,
    upload,
};

export default upload;
