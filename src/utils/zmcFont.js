/**
 * 子明词详情网络字体：解析 CDN cn-font-split CSS，按正文用字按需 loadFontFace
 * （同 family 多次加载会互相覆盖，故每个分包使用独立 family，再按字符分片渲染）
 */

const FONT_STORAGE_KEY = "zmc-detail-font";

const FONT_OPTIONS = [
    {
        key: "youmokeban",
        label: "油墨刻本",
        family: "AaGuDianKeBenSongYMB",
        css: "https://cdn.mingsixue.com/fonts/zh/Aa/subpackage/song_you_mo_ban/result.css",
        base: "https://cdn.mingsixue.com/fonts/zh/Aa/subpackage/song_you_mo_ban/",
        fallback: "Songti SC, STSong, SimSun, serif",
    },
    {
        key: "shoujinti",
        label: "瘦金体简",
        family: "SJshoujin",
        css: "https://cdn.mingsixue.com/fonts/zh/SanJi/subpackage/shou_jin_ti_jian/result.css",
        base: "https://cdn.mingsixue.com/fonts/zh/SanJi/subpackage/shou_jin_ti_jian/",
        fallback: "STSong, SimSun, serif",
    },
];

/** @type {Record<string, Array<{ file: string, ranges: Array<[number, number]> }>>} */
const cssCache = {};
/** @type {Set<string>} */
const loadedFamilies = new Set();

function getFontOption(key) {
    return FONT_OPTIONS.find((item) => item.key === key) || FONT_OPTIONS[0];
}

function getSavedFontKey() {
    try {
        const key = wx.getStorageSync(FONT_STORAGE_KEY);
        if (key && FONT_OPTIONS.some((item) => item.key === key)) return key;
    } catch (e) {
        // ignore
    }
    return "youmokeban";
}

function saveFontKey(key) {
    try {
        wx.setStorageSync(FONT_STORAGE_KEY, key);
    } catch (e) {
        // ignore
    }
}

function fetchCss(url) {
    return new Promise((resolve, reject) => {
        wx.request({
            url,
            method: "GET",
            dataType: "text",
            success(res) {
                if (res.statusCode === 200 && typeof res.data === "string") {
                    resolve(res.data);
                    return;
                }
                reject(new Error(`字体 CSS 加载失败: ${res.statusCode}`));
            },
            fail: reject,
        });
    });
}

function parseUnicodeRanges(raw) {
    const ranges = [];
    String(raw || "")
        .split(",")
        .forEach((part) => {
            const token = part.trim().toUpperCase().replace(/^U\+/, "");
            if (!token) return;
            if (token.includes("-")) {
                const [a, b] = token.split("-");
                const start = parseInt(a, 16);
                const end = parseInt(b, 16);
                if (!Number.isNaN(start) && !Number.isNaN(end)) {
                    ranges.push([start, end]);
                }
            } else {
                const code = parseInt(token, 16);
                if (!Number.isNaN(code)) ranges.push([code, code]);
            }
        });
    return ranges;
}

function parseFontFaces(cssText) {
    const faces = [];
    const re = /@font-face\s*\{([^}]+)\}/g;
    let match;
    while ((match = re.exec(cssText))) {
        const block = match[1];
        const src = block.match(/url\(["']?(\.\/[^"')]+)["']?\)/);
        const range = block.match(/unicode-range\s*:\s*([^;]+)/i);
        if (!src || !range) continue;
        faces.push({
            file: src[1],
            ranges: parseUnicodeRanges(range[1]),
        });
    }
    return faces;
}

async function getFontFaces(option) {
    if (!option.css) return [];
    if (cssCache[option.key]) return cssCache[option.key];
    const cssText = await fetchCss(option.css);
    const faces = parseFontFaces(cssText);
    cssCache[option.key] = faces;
    return faces;
}

function covers(face, codePoint) {
    for (let i = 0; i < face.ranges.length; i++) {
        const [start, end] = face.ranges[i];
        if (codePoint >= start && codePoint <= end) return true;
    }
    return false;
}

function findFace(codePoint, faces) {
    for (let i = 0; i < faces.length; i++) {
        if (covers(faces[i], codePoint)) return faces[i];
    }
    return null;
}

function subsetFamily(baseFamily, file) {
    const id = String(file)
        .replace(/^\.\//, "")
        .replace(/\.\w+$/, "")
        .slice(0, 16);
    return `${baseFamily}__${id}`;
}

function loadFontFaceOnce(family, sourceUrl) {
    if (loadedFamilies.has(family)) return Promise.resolve();
    return new Promise((resolve) => {
        wx.loadFontFace({
            global: true,
            family,
            source: `url("${sourceUrl}")`,
            success() {
                loadedFamilies.add(family);
                resolve();
            },
            fail() {
                // 单包失败不阻断整页，对应字符走 fallback
                resolve();
            },
        });
    });
}

function collectNeededFaces(text, faces) {
    const map = new Map();
    for (const ch of String(text || "")) {
        const face = findFace(ch.codePointAt(0), faces);
        if (face) map.set(face.file, face);
    }
    return Array.from(map.values());
}

function buildRuns(text, faces, baseFamily, fallback) {
    const source = String(text || "");
    if (!source) return [];
    if (!faces.length || !baseFamily) {
        return [{ text: source, family: fallback }];
    }

    const runs = [];
    let buf = "";
    let current = null;

    for (const ch of source) {
        const face = findFace(ch.codePointAt(0), faces);
        const family = face ? subsetFamily(baseFamily, face.file) : fallback;
        if (family === current) {
            buf += ch;
        } else {
            if (buf) runs.push({ text: buf, family: current });
            buf = ch;
            current = family;
        }
    }
    if (buf) runs.push({ text: buf, family: current });
    return runs;
}

/**
 * 按所选字体渲染文案：返回标题/正文 runs，并完成所需分包加载
 * @param {string} fontKey
 * @param {{ title?: string, lines?: string[] }} content
 */
async function prepareFontRender(fontKey, content = {}) {
    const option = getFontOption(fontKey);
    const title = content.title || "";
    const lines = Array.isArray(content.lines) ? content.lines : [];
    const allText = `${title}\n${lines.join("\n")}`;

    if (!option.css) {
        const family = option.fallback;
        return {
            fontKey: option.key,
            fontLabel: option.label,
            containerFamily: family,
            titleRuns: [{ text: title, family }],
            lineRuns: lines.map((line) =>
                line
                    ? [{ text: line, family }]
                    : [{ text: "", family }],
            ),
        };
    }

    const faces = await getFontFaces(option);
    const needed = collectNeededFaces(allText, faces);
    await Promise.all(
        needed.map((face) => {
            const file = face.file.replace(/^\.\//, "");
            const family = subsetFamily(option.family, face.file);
            return loadFontFaceOnce(family, `${option.base}${file}`);
        }),
    );

    return {
        fontKey: option.key,
        fontLabel: option.label,
        containerFamily: option.fallback,
        titleRuns: buildRuns(title, faces, option.family, option.fallback),
        lineRuns: lines.map((line) =>
            line
                ? buildRuns(line, faces, option.family, option.fallback)
                : [{ text: "", family: option.fallback }],
        ),
    };
}

export default {
    FONT_OPTIONS,
    FONT_STORAGE_KEY,
    getFontOption,
    getSavedFontKey,
    saveFontKey,
    prepareFontRender,
};
