/** 常见中文颜色名 → CSS 色值（用于色块预览） */
const COLOR_NAME_MAP = {
    红: "#e74c3c",
    红色: "#e74c3c",
    大红: "#c0392b",
    朱红: "#e74c3c",
    粉: "#ff85c0",
    粉色: "#ff85c0",
    粉红: "#ff85c0",
    桃红: "#ff6b9d",
    玫红: "#c41d7f",
    橙: "#fa8c16",
    橙色: "#fa8c16",
    橘: "#fa8c16",
    橘色: "#fa8c16",
    橘黄: "#fa8c16",
    黄: "#fadb14",
    黄色: "#fadb14",
    金: "#faad14",
    金色: "#faad14",
    米黄: "#ffe7ba",
    奶油色: "#fff7e6",
    绿: "#52c41a",
    绿色: "#52c41a",
    草绿: "#73d13d",
    墨绿: "#237804",
    青绿: "#13c2c2",
    青: "#13c2c2",
    青色: "#13c2c2",
    蓝: "#1677ff",
    蓝色: "#1677ff",
    天蓝: "#69b1ff",
    深蓝: "#003eb3",
    海蓝: "#0958d9",
    靛蓝: "#2f54eb",
    紫: "#722ed1",
    紫色: "#722ed1",
    淡紫: "#b37feb",
    褐: "#8b5a2b",
    褐色: "#8b5a2b",
    棕: "#a0522d",
    棕色: "#a0522d",
    咖啡: "#6f4e37",
    咖啡色: "#6f4e37",
    卡其: "#c3b091",
    卡其色: "#c3b091",
    米: "#f5f0e6",
    米色: "#f5f0e6",
    白: "#ffffff",
    白色: "#ffffff",
    乳白: "#fffcf0",
    灰: "#8c8c8c",
    灰色: "#8c8c8c",
    银灰: "#bfbfbf",
    深灰: "#595959",
    黑: "#1f1f1f",
    黑色: "#1f1f1f",
    银: "#c0c0c0",
    银色: "#c0c0c0",
    透明: "transparent",
};

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_RE = /^rgba?\(/i;

/** 根据颜色名称解析可预览的 CSS 色值；无法识别时返回空字符串 */
export function resolveColorCss(name) {
    const n = String(name || "").trim();
    if (!n) return "";

    if (COLOR_NAME_MAP[n]) return COLOR_NAME_MAP[n];
    if (HEX_RE.test(n) || RGB_RE.test(n)) return n;

    let best = "";
    Object.keys(COLOR_NAME_MAP).forEach((key) => {
        if (n.includes(key) && key.length > best.length) {
            best = key;
        }
    });
    return best ? COLOR_NAME_MAP[best] : "";
}
