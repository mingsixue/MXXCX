/**
 * @file 常用校验
 */

/**
 * 校验大陆手机号
 * @param {string|number} val
 * @returns {boolean}
 */
const isPhone = (val) => {
    return /^1[3-9]\d{9}$/.test(`${val || ""}`);
};

/**
 * 校验大陆 18 位身份证号（含校验位）
 * @param {string|number} val
 * @returns {boolean}
 */
const isIdCard = (val) => {
    const id = `${val || ""}`;
    if (!/^\d{17}[\dXx]$/.test(id)) return false;

    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const codes = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
    let sum = 0;
    for (let i = 0; i < 17; i++) {
        sum += Number(id[i]) * weights[i];
    }
    return codes[sum % 11] === id[17].toUpperCase();
};

export { isPhone, isIdCard };
export default { isPhone, isIdCard };
