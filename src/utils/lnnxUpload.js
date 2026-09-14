/**
 * @file 流年凝雪模块图片上传（走后端 /{module}/upload）
 */
import { getToken } from "./user";
import { getApiHost, getEnvHeaders } from "./env";

/**
 * 上传单张本地图片到 lnnx 模块接口
 * @param {string} filePath
 * @param {string} module food | medication | clothes | goods | meal
 * @returns {Promise<{key: string, url: string}>}
 */
const uploadLnnxImage = (filePath, module) => {
    const token = getToken();
    return new Promise((resolve, reject) => {
        wx.uploadFile({
            url: `${getApiHost()}${module}/upload`,
            filePath,
            name: "file",
            header: {
                ...(token ? { Authorization: String(token).startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
                ...getEnvHeaders(),
            },
            success: (res) => {
                let body = {};
                try {
                    body = typeof res.data === "string" ? JSON.parse(res.data) : res.data || {};
                } catch (e) {
                    reject(new Error("上传响应解析失败"));
                    return;
                }
                if (body.statusCode === 1 || body.statusCode === "1") {
                    const data = body.data || {};
                    if (data.key) {
                        resolve({ key: data.key, url: data.url || "" });
                        return;
                    }
                }
                reject(new Error(body.message || "上传失败"));
            },
            fail: reject,
        });
    });
};

/**
 * 选择并上传图片到 lnnx 模块
 * @param {object} options
 * @param {string} options.module food | medication | clothes | goods | meal
 * @param {number} [options.count=1] 为 1 时 resolve 单个对象，否则为数组
 * @param {string[]} [options.sourceType]
 * @returns {Promise<{key: string, url: string}|Array<{key: string, url: string}>>}
 */
const chooseAndUploadLnnxImage = (options = {}) => {
    const module = options.module;
    if (!module) {
        return Promise.reject(new Error("缺少 module"));
    }
    const count = options.count || 1;

    return new Promise((resolve, reject) => {
        wx.chooseMedia({
            count,
            mediaType: ["image"],
            sourceType: options.sourceType || ["album", "camera"],
            success: async (resp) => {
                try {
                    const files = resp.tempFiles || [];
                    const results = [];
                    for (let i = 0; i < files.length; i++) {
                        results.push(await uploadLnnxImage(files[i].tempFilePath, module));
                    }
                    resolve(count === 1 ? results[0] : results);
                } catch (e) {
                    reject(e);
                }
            },
            fail: reject,
        });
    });
};

export { uploadLnnxImage, chooseAndUploadLnnxImage };
export default chooseAndUploadLnnxImage;
