/**
 * @file 数字 / 金额工具
 */
import { padStart, padEnd } from "./string";

/**
 * 精确四则运算，避免浮点精度丢失
 * @param {number} a 运算数1
 * @param {number} b 运算数2
 * @param {'add'|'subtract'|'multiply'|'divide'} operate 运算类型
 * @returns {number}
 */
const getNumberAccuracy = (a, b, operate) => {
    a = Number(a);
    b = Number(b);

    const isInteger = (obj) => Math.floor(obj) === obj;

    const toInteger = (floatNum) => {
        const ret = { times: 1, num: 0 };
        if (isInteger(floatNum)) {
            ret.num = floatNum;
            return ret;
        }
        const strfi = `${floatNum}`;
        const dotPos = strfi.indexOf(".");
        const len = strfi.substr(dotPos + 1).length;
        const times = Math.pow(10, len);
        const intNum = Number(floatNum.toString().replace(".", ""));
        ret.times = times;
        ret.num = intNum;
        return ret;
    };

    const o1 = toInteger(a);
    const o2 = toInteger(b);
    const n1 = o1.num;
    const n2 = o2.num;
    const t1 = o1.times;
    const t2 = o2.times;
    const max = t1 > t2 ? t1 : t2;
    let result = null;

    switch (operate) {
        case "add":
            result =
                t1 === t2
                    ? n1 + n2
                    : t1 > t2
                    ? n1 + n2 * (t1 / t2)
                    : n1 * (t2 / t1) + n2;
            return result / max;
        case "subtract":
            result =
                t1 === t2
                    ? n1 - n2
                    : t1 > t2
                    ? n1 - n2 * (t1 / t2)
                    : n1 * (t2 / t1) - n2;
            return result / max;
        case "multiply":
            return (n1 * n2) / (t1 * t2);
        case "divide":
            return (n1 / n2) * (t2 / t1);
        default:
            return NaN;
    }
};

/**
 * 截断小数位数（不四舍五入）
 * @param {number} num
 * @param {number} [digits=2] 保留位数
 * @returns {string}
 */
const toFixedFloor = (num, digits = 2) => {
    const n = Number(num);
    if (Number.isNaN(n)) return "0";
    const factor = Math.pow(10, digits);
    const truncated = Math[n < 0 ? "ceil" : "floor"](n * factor) / factor;
    const parts = `${truncated}`.split(".");
    if (digits <= 0) return parts[0];
    return `${parts[0]}.${padEnd(parts[1] || "", digits, "0")}`;
};

/**
 * 价格千分位格式化
 * @param {number|string} num
 * @param {number} [digits=2] 小数位数（截断）
 * @returns {string} 如 1,234.56
 */
const formatPrice = (num, digits = 2) => {
    const str = toFixedFloor(num, digits);
    const [intPart, decPart] = str.split(".");
    const withComma = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decPart !== undefined ? `${withComma}.${decPart}` : withComma;
};

export {
    getNumberAccuracy,
    toFixedFloor,
    formatPrice,
    padStart,
    padEnd,
};

export default {
    getNumberAccuracy,
    toFixedFloor,
    formatPrice,
    padStart,
    padEnd,
};
