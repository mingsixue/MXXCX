/**
 * @file 防抖 / 节流
 */

/**
 * 防抖：连续触发时仅最后一次执行
 * @param {Function} fn 目标函数
 * @param {number} [delay=300] 延迟毫秒
 * @returns {Function}
 */
const debounce = (fn, delay = 300) => {
    let timer = null;
    return function (...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
};

/**
 * 节流：固定时间间隔内最多执行一次
 * @param {Function} fn 目标函数
 * @param {number} [delay=300] 间隔毫秒
 * @returns {Function}
 */
const throttle = (fn, delay = 300) => {
    let last = 0;
    let timer = null;
    return function (...args) {
        const now = Date.now();
        const remain = delay - (now - last);
        if (remain <= 0) {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            last = now;
            fn.apply(this, args);
        } else if (!timer) {
            timer = setTimeout(() => {
                last = Date.now();
                timer = null;
                fn.apply(this, args);
            }, remain);
        }
    };
};

export { debounce, throttle };
export default { debounce, throttle };
