/**
 * @file Base64 编解码（UTF-8 字符串）
 */
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

/**
 * Base64 编码
 * @param {string} [input='']
 * @returns {string}
 */
const encode = (input = "") => {
    const str = unescape(encodeURIComponent(`${input}`));
    let output = "";
    for (let i = 0; i < str.length; i += 3) {
        const c1 = str.charCodeAt(i);
        const c2 = str.charCodeAt(i + 1);
        const c3 = str.charCodeAt(i + 2);
        const e1 = c1 >> 2;
        const e2 = ((c1 & 3) << 4) | (c2 >> 4);
        const e3 = isNaN(c2) ? 64 : ((c2 & 15) << 2) | (c3 >> 6);
        const e4 = isNaN(c3) ? 64 : c3 & 63;
        output += chars.charAt(e1) + chars.charAt(e2) + chars.charAt(e3) + chars.charAt(e4);
    }
    return output;
};

/**
 * Base64 解码
 * @param {string} [input='']
 * @returns {string}
 */
const decode = (input = "") => {
    let str = `${input}`.replace(/[^A-Za-z0-9+/=]/g, "");
    let output = "";
    for (let i = 0; i < str.length; i += 4) {
        const e1 = chars.indexOf(str.charAt(i));
        const e2 = chars.indexOf(str.charAt(i + 1));
        const e3 = chars.indexOf(str.charAt(i + 2));
        const e4 = chars.indexOf(str.charAt(i + 3));
        const c1 = (e1 << 2) | (e2 >> 4);
        const c2 = ((e2 & 15) << 4) | (e3 >> 2);
        const c3 = ((e3 & 3) << 6) | e4;
        output += String.fromCharCode(c1);
        if (e3 !== 64) output += String.fromCharCode(c2);
        if (e4 !== 64) output += String.fromCharCode(c3);
    }
    try {
        return decodeURIComponent(escape(output));
    } catch (e) {
        return output;
    }
};

export { encode, decode };
export default { encode, decode };
