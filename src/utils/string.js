/**
 * @file 字符串工具
 */

/**
 * 前补字符至指定长度
 * @param {string|number} val 原值
 * @param {number} [len=2] 目标长度
 * @param {string} [ch='0'] 填充字符
 * @returns {string}
 */
const padStart = (val, len = 2, ch = "0") => {
    let str = `${val}`;
    while (str.length < len) {
        str = ch + str;
    }
    return str;
};

/**
 * 后补字符至指定长度
 * @param {string|number} val 原值
 * @param {number} [len=2] 目标长度
 * @param {string} [ch='0'] 填充字符
 * @returns {string}
 */
const padEnd = (val, len = 2, ch = "0") => {
    let str = `${val}`;
    while (str.length < len) {
        str = str + ch;
    }
    return str;
};

/**
 * 生成随机字符串（字母数字）
 * @param {number} [len=16] 长度
 * @returns {string}
 */
const randomString = (len = 16) => {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < len; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export { padStart, padEnd, randomString };
export default { padStart, padEnd, randomString };
