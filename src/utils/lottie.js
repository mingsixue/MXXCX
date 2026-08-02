/**
 * @file Lottie 动画封装
 * 依赖 lottie-miniprogram（根目录 yarn 安装；构建时自动同步到产物 miniprogram_npm）
 * 用法见 packageDemo/lottie 示例页
 */
let lottieModule = null;

/**
 * 获取 lottie-miniprogram 模块
 * @returns {Promise}
 */
const getLottie = () => {
    if (lottieModule) return Promise.resolve(lottieModule);
    return new Promise((resolve, reject) => {
        try {
            // eslint-disable-next-line global-require
            lottieModule = require("lottie-miniprogram");
            resolve(lottieModule);
        } catch (e) {
            reject(
                new Error(
                    "未找到 lottie-miniprogram，请在工程根目录 yarn，并重新 yarn start / build"
                )
            );
        }
    });
};

/**
 * 在 canvas 上播放 Lottie 动画
 * @param {object} options
 * @param {object} options.canvas type="2d" 的 canvas 节点
 * @param {object} [options.animationData] 动画 JSON
 * @param {string} [options.path] 动画 JSON 路径
 * @param {boolean} [options.loop=true]
 * @param {boolean} [options.autoplay=true]
 * @returns {Promise} 动画实例
 */
const play = async ({ canvas, animationData, path, loop = true, autoplay = true }) => {
    const lottie = await getLottie();
    return new Promise((resolve) => {
        lottie.setup(canvas);
        const ani = lottie.loadAnimation({
            loop,
            autoplay,
            animationData,
            path,
            rendererSettings: { context: canvas.getContext("2d") },
        });
        resolve(ani);
    });
};

export { getLottie, play };
export default { getLottie, play };
