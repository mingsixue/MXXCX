/**
 * @file 日期时间工具
 */
import { padStart } from "./string";

/**
 * 将多种时间输入统一转为 Date
 * @param {Date|number|string} input Date / 秒或毫秒时间戳 / 可解析字符串
 * @returns {Date}
 */
const toDate = (input) => {
    if (input instanceof Date) return input;
    if (typeof input === "number") {
        return new Date(input < 1e12 ? input * 1000 : input);
    }
    return new Date(input);
};

/**
 * 获取秒级时间戳；无参时返回当前时间
 * @param {Date|number|string} [input]
 * @returns {number} 秒级时间戳
 */
const getTimestamp = (input) => {
    if (input === undefined || input === null || input === "") {
        return Math.floor(Date.now() / 1000);
    }
    return Math.floor(+toDate(input) / 1000);
};

/**
 * 日期格式化
 * @param {Date|number|string} input 时间
 * @param {string} [fmt='yyyy-MM-dd HH:mm:ss'] 格式，支持 y/M/d/H/h/m/s/t
 * @returns {string}
 * @example formatDate(Date.now(), 'yyyy-MM-dd')
 */
const formatDate = (input, fmt = "yyyy-MM-dd HH:mm:ss") => {
    const date = toDate(input);
    if (Number.isNaN(+date)) return "";

    const map = {
        "y+": date.getFullYear(),
        "M+": date.getMonth() + 1,
        "d+": date.getDate(),
        "H+": date.getHours(),
        "h+": date.getHours() % 12 || 12,
        "m+": date.getMinutes(),
        "s+": date.getSeconds(),
        "t+": date.getHours() >= 12 ? "PM" : "AM",
    };

    let result = fmt;
    Object.keys(map).forEach((key) => {
        if (new RegExp(`(${key})`).test(result)) {
            const matched = RegExp.$1;
            const val = map[key];
            if (key === "y+") {
                result = result.replace(matched, `${val}`.substring(4 - matched.length));
            } else if (key === "t+") {
                result = result.replace(matched, `${val}`.substring(0, matched.length));
            } else {
                result = result.replace(
                    matched,
                    matched.length === 1 ? `${val}` : padStart(val, matched.length)
                );
            }
        }
    });
    return result;
};

/**
 * 时间戳转日期字符串（formatDate 别名）
 * @param {number|string|Date} ts
 * @param {string} [fmt='yyyy-MM-dd HH:mm:ss']
 * @returns {string}
 */
const timestampToDate = (ts, fmt = "yyyy-MM-dd HH:mm:ss") => {
    return formatDate(ts, fmt);
};

/**
 * 判断 time 是否在 compare 之前
 * @param {Date|number|string} time
 * @param {Date|number|string} [compare=Date.now()]
 * @returns {boolean}
 */
const isBefore = (time, compare = Date.now()) => {
    return +toDate(time) < +toDate(compare);
};

/**
 * 判断 time 是否在 compare 之后
 * @param {Date|number|string} time
 * @param {Date|number|string} [compare=Date.now()]
 * @returns {boolean}
 */
const isAfter = (time, compare = Date.now()) => {
    return +toDate(time) > +toDate(compare);
};

/**
 * 判断 time 是否在 [start, end] 区间内（含边界）
 * @param {Date|number|string} time
 * @param {Date|number|string} start
 * @param {Date|number|string} end
 * @returns {boolean}
 */
const isBetween = (time, start, end) => {
    const t = +toDate(time);
    return t >= +toDate(start) && t <= +toDate(end);
};

export { toDate, getTimestamp, formatDate, timestampToDate, isBefore, isAfter, isBetween };

export default {
    toDate,
    getTimestamp,
    formatDate,
    timestampToDate,
    isBefore,
    isAfter,
    isBetween,
};
