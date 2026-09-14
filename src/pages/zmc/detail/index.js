import MX from "@utils/index";
import zmcFont from "@utils/zmcFont";

const TYPE_LABELS = {
    1: "诗",
    2: "词",
    3: "现代诗",
    4: "曲",
};

const SEAL_TEXT = {
    1: "詩",
    2: "詞",
    3: "現代詩",
    4: "曲",
};

const SERIES_LABELS = {
    1: "子明词",
    2: "山水诗",
    3: "素雪词",
    4: "艳雨词",
    5: "恋娟词",
};

function getSeriesWatermark(series) {
    return SERIES_LABELS[Number(series)] || "";
}

const LIKED_STORAGE_KEY = "zmc_liked_map";

function readLikedMap() {
    try {
        const raw = wx.getStorageSync(LIKED_STORAGE_KEY);
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
            return raw;
        }
    } catch (e) {
        // ignore
    }
    return {};
}

function readLiked(key) {
    if (!key) return false;
    return !!readLikedMap()[key];
}

function writeLiked(key, liked) {
    if (!key) return;
    try {
        const map = readLikedMap();
        if (liked) {
            map[key] = true;
        } else {
            delete map[key];
        }
        wx.setStorageSync(LIKED_STORAGE_KEY, map);
    } catch (e) {
        // ignore
    }
}

/**
 * 词排版分句：
 * 1. ，且 <4 字：不换行
 * 2. ，且 ≥4 字：换行
 * 3. 。！？：换行
 * 4. 、：不换行
 * 5. 连续 2 句都是逗号，第 3 句（不论逗号/句号等）换行
 */
function splitCiClauses(text) {
    const flat = String(text || "").replace(/\n+/g, "").trim();
    if (!flat) return [];

    const matched = flat.match(/[^，。！？、]+[，。！？、]?/g);
    if (!matched || !matched.length) return [flat];

    const lines = [];
    let pending = "";
    let commaStreak = 0;

    const flushPending = () => {
        if (pending) {
            lines.push(pending.trim());
            pending = "";
        }
    };

    // 已连续 2 句逗号时，第 3 句起新列
    const breakAfterTwoCommas = () => {
        if (commaStreak < 2) return;
        flushPending();
        commaStreak = 0;
    };

    for (let i = 0; i < matched.length; i++) {
        const part = matched[i].trim();
        if (!part) continue;

        if (/[。！？]$/.test(part)) {
            breakAfterTwoCommas();
            lines.push((pending + part).trim());
            pending = "";
            commaStreak = 0;
            continue;
        }

        if (/、$/.test(part)) {
            pending += part;
            commaStreak = 0;
            continue;
        }

        if (/，$/.test(part)) {
            breakAfterTwoCommas();

            const charCount = Array.from(part.replace(/，$/, "")).length;
            if (charCount >= 4) {
                flushPending();
                lines.push(part);
                commaStreak = 1;
            } else {
                pending += part;
                commaStreak += 1;
            }
            continue;
        }

        breakAfterTwoCommas();
        pending += part;
        commaStreak = 0;
    }

    if (pending.trim()) lines.push(pending.trim());
    return lines.filter((item) => item.length > 0);
}

/**
 * 将接口 content（数组或字符串）拆成详情展示行
 */
function formatContentLines(content, type) {
    let text = "";
    if (Array.isArray(content)) {
        // 数组空项 / 单独的 ## 都视为阕分隔（与官网 ## → 双换行一致）
        text = content
            .map((line) => {
                const s = line == null ? "" : String(line);
                if (!s.trim() || s.trim() === "##") return "##";
                return s;
            })
            .join("\n");
    } else {
        text = content == null ? "" : String(content);
    }

    text = text.replace(/&nbsp;/g, "");
    // 统一成双换行，便于按阕切分
    text = text.replace(/\s*##\s*/g, "\n\n");
    if (!text.trim()) return [];

    const compact = (lines) =>
        lines.map((line) => line.trim()).filter((line) => line.length > 0);

    // 词：专用排版；## / 双换行 → 空一列
    if (Number(type) === 2) {
        const stanzas = text
            .split(/\n{2,}/)
            .map((stanza) => stanza.trim())
            .filter((stanza) => stanza.length > 0);
        const lines = [];
        stanzas.forEach((stanza, index) => {
            if (index > 0) lines.push("");
            lines.push(...splitCiClauses(stanza));
        });
        return lines;
    }

    // 其余类型：## 仅作分句，不保留空行
    text = text.replace(/\n{2,}/g, "\n").trim();
    if (!text) return [];

    if (Number(type) === 3) {
        return compact(text.split(/\n+/));
    }

    // 诗：按 ，。！？ 分句，一列一句（对齐官网详情）
    if (Number(type) === 1) {
        const flat = text.replace(/\n+/g, "");
        const matched = flat.match(/[^，。！？]+[，。！？]?/g);
        return compact(matched || [flat]);
    }

    const parts = text.split(/([。？！])/);
    const lines = [];
    let buf = "";
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        if (/^[。？！]$/.test(part)) {
            buf += part;
            const line = buf.replace(/\n+/g, "").trim();
            if (line.length > 1) lines.push(line);
            buf = "";
        } else {
            buf += part;
        }
    }
    const rest = buf.replace(/\n+/g, "").trim();
    if (rest.length > 1) {
        lines.push(rest);
    }

    if (!lines.length) {
        return compact(text.split(/\n+/));
    }
    return compact(lines);
}

function buildMetaItems(detail) {
    const items = [];
    if (detail.cipai) items.push(detail.cipai);
    if (detail.dateText) items.push(detail.dateText);
    if (detail.lunar) items.push(detail.lunar);
    if (detail.place) items.push(`写于・${detail.place}`);
    return items;
}

/**
 * 按窗口高度（重点兼容 667）计算一屏布局与诗词字号
 * @param {string[]} lines
 * @param {number} [type] 1诗 2词 3现代诗 4曲
 */
function computeScreenLayout(lines = [], type) {
    const info = MX.getSystemInfo ? MX.getSystemInfo() : wx.getSystemInfoSync();
    const windowWidth = info.windowWidth || 375;
    const windowHeight = info.windowHeight || 667;
    const statusBarHeight = info.statusBarHeight || 20;
    const navHeight = statusBarHeight + 46;
    const safe = MX.getSafeArea ? MX.getSafeArea() : { bottom: 0 };
    const safeBottom = safe.bottom || 0;
    const rpx = windowWidth / 750;
    const typeNum = Number(type) || 0;

    const contentHeight = Math.max(windowHeight - navHeight, 480);
    // 压缩头部 / 上下篇占位，给正文留足空间（667 约剩 380~440px）
    const chrome =
        10 + // page padding top
        58 + // head
        12 + // body margin
        54 + // adjacent
        8 + // page padding bottom
        safeBottom; // 底部安全区（刘海屏 Home 指示条）
    const poemAreaHeight = Math.max(contentHeight - chrome, 220);

    // 页面左右 padding 28rpx；正文区再扣左右留白 + 落款
    const pagePadX = 56 * rpx;
    let sidePadX = 80 * rpx;
    let sealW = 56 * rpx;
    if (typeNum === 2) {
        // 词：左右留白更大，并预留落款槽（系列水印+印章），保证一屏展示全
        sidePadX = 96 * rpx;
        sealW = 88 * rpx;
    } else if (typeNum === 3) {
        // 现代诗：允许横滑，左右稍紧
        sidePadX = 72 * rpx;
        sealW = 64 * rpx;
    }
    const availW = Math.max(windowWidth - pagePadX - sidePadX - sealW, 200);

    const colCount = Math.max(lines.length, 1);
    const maxChars = Math.max(
        1,
        ...lines.map((line) => Array.from(String(line || "")).length),
    );

    // 竖排：高度约束字数，宽度约束列数
    const fontByH = poemAreaHeight / (maxChars * 1.16);
    // 现代诗列多时按约一屏列数估字号，其余类型按全列适配以免超出
    const colsForWidth =
        typeNum === 3 ? Math.min(colCount, 6) : colCount;
    const fontByW = availW / (colsForWidth * 1.34);
    let poemFontPx = Math.min(fontByH, fontByW, 46);
    poemFontPx = Math.max(Math.floor(poemFontPx), 18);

    return {
        contentHeight,
        poemAreaHeight: Math.floor(poemAreaHeight),
        poemFontPx,
    };
}

Page({
    data: {
        key: "",
        detail: null,
        lines: [],
        metaItems: [],
        loading: true,
        empty: false,
        fontOptions: zmcFont.FONT_OPTIONS.map(({ key, label }) => ({
            key,
            label,
        })),
        fontKey: "youmokeban",
        fontMenuOpen: false,
        fontLoading: false,
        lineRuns: [],
        containerFamily: "Songti SC, STSong, SimSun, serif",
        seriesWatermark: "",
        viewTotal: 0,
        likeCount: 0,
        liked: false,
        likePending: false,
        likeBurst: false,
        likeBurstPhase: "",
        prev: null,
        next: null,
        contentHeight: 600,
        poemAreaHeight: 360,
        poemFontPx: 36,
        likeOffsetPx: 24,
    },

    /**
     * 按「诗词底部 → 底部分割线」可用空间，垂直居中点赞区（不改诗词高度）
     */
    updateLikeOffset() {
        if (!this.data.detail) return;
        const run = () => {
            wx.createSelectorQuery()
                .select(".body-center")
                .boundingClientRect()
                .select(".poem-wrap")
                .boundingClientRect()
                .select(".like-action")
                .boundingClientRect()
                .exec((res) => {
                    const center = res && res[0];
                    const poem = res && res[1];
                    const like = res && res[2];
                    if (!center || !poem) return;
                    // 诗词内容底部 → 底部分割线（body-center 底边）的实际距离
                    const bottomGap = Math.max(center.bottom - poem.bottom, 0);
                    const likeH = (like && like.height) || 48;
                    const offset = Math.max(Math.round((bottomGap - likeH) / 2), 0);
                    if (offset !== this.data.likeOffsetPx) {
                        this.setData({ likeOffsetPx: offset });
                    }
                });
        };
        if (typeof wx.nextTick === "function") {
            wx.nextTick(run);
        } else {
            setTimeout(run, 32);
        }
    },

    onLoad(options = {}) {
        const layout = computeScreenLayout([], 0);
        const key = decodeURIComponent(options.key || "");
        const fontKey = zmcFont.getSavedFontKey();
        this.setData({
            key,
            fontKey,
            ...layout,
        });
        if (!key) {
            this.setData({ loading: false, empty: true });
            return;
        }
        this.loadPage(key);
        wx.showShareMenu({
            withShareTicket: true,
            menus: ["shareAppMessage"],
        });
    },

    onShow() {
        wx.setNavigationBarColor({
            frontColor: "#ffffff",
            backgroundColor: "#A02731",
        });
    },

    onShareAppMessage() {
        const { detail, key } = this.data;
        const typeStr = detail ? TYPE_LABELS[detail.type] || "" : "";
        const title = detail
            ? `「${typeStr}」${detail.title || "无题"}`
            : "子明词";
        return {
            title,
            path: `/pages/zmc/detail/index?key=${encodeURIComponent(key)}`,
        };
    },

    async loadPage(key) {
        const reqId = (this._loadReqId = (this._loadReqId || 0) + 1);
        this.setData({ loading: true, empty: false, key });
        try {
            const [detail, adjacent] = await Promise.all([
                MX.get("zmc/detail", { key }),
                MX.get("zmc/adjacent", { key }).catch(() => ({
                    prev: null,
                    next: null,
                })),
            ]);
            if (reqId !== this._loadReqId) return;

            if (!detail || !detail.key) {
                this.setData({
                    loading: false,
                    empty: true,
                    detail: null,
                    prev: null,
                    next: null,
                });
                return;
            }

            const lines = formatContentLines(detail.content, detail.type);
            const layout = computeScreenLayout(lines, detail.type);
            const nextDetail = {
                ...detail,
                typeStr: TYPE_LABELS[detail.type] || "其他",
                sealText: SEAL_TEXT[detail.type] || "詩",
                dateText: String(detail.date || "").replace(/-/g, "/"),
            };
            const fontKey = this.data.fontKey || zmcFont.getSavedFontKey();
            const fallback = zmcFont.getFontOption(fontKey).fallback;
            const metaItems = buildMetaItems(nextDetail);
            const seriesWatermark = getSeriesWatermark(nextDetail.series);
            const viewTotal =
                Number(detail.view_total) ||
                Number(detail.view_count || 0) + Number(detail.xcx_view_count || 0);
            const likeCount = Number(detail.like_count || 0);

            // 网络字体未就位前保持加载中，避免先闪系统字体
            let lineRuns = lines.map((line) =>
                line
                    ? [{ text: line, family: fallback }]
                    : [{ text: "", family: fallback }],
            );
            let containerFamily = fallback;
            try {
                const rendered = await zmcFont.prepareFontRender(fontKey, {
                    lines,
                });
                if (reqId !== this._loadReqId) return;
                lineRuns = rendered.lineRuns;
                containerFamily = rendered.containerFamily;
            } catch (e) {
                if (reqId !== this._loadReqId) return;
                // 字体失败时用 fallback，仍保证可阅读
            }

            this.setData(
                {
                    key,
                    detail: nextDetail,
                    lines,
                    metaItems,
                    seriesWatermark,
                    viewTotal,
                    likeCount,
                    liked: readLiked(key),
                    likePending: false,
                    loading: false,
                    fontLoading: false,
                    fontKey,
                    empty: false,
                    prev: adjacent && adjacent.prev ? adjacent.prev : null,
                    next: adjacent && adjacent.next ? adjacent.next : null,
                    lineRuns,
                    containerFamily,
                    ...layout,
                },
                () => {
                    this.updateLikeOffset();
                    setTimeout(() => this.updateLikeOffset(), 80);
                },
            );
        } catch (e) {
            if (reqId !== this._loadReqId) return;
            this.setData({
                loading: false,
                empty: true,
                detail: null,
                prev: null,
                next: null,
            });
        }
    },

    async applyFont(fontKey, detail, lines) {
        const currentDetail = detail || this.data.detail;
        const currentLines = lines || this.data.lines;
        if (!currentDetail) return;

        this.setData({
            fontLoading: true,
            fontKey,
            fontMenuOpen: false,
        });
        try {
            const rendered = await zmcFont.prepareFontRender(fontKey, {
                lines: currentLines,
            });
            if (this.data.fontKey !== fontKey) return;
            this.setData(
                {
                    lineRuns: rendered.lineRuns,
                    containerFamily: rendered.containerFamily,
                    fontLoading: false,
                    ...computeScreenLayout(currentLines, currentDetail.type),
                },
                () => {
                    this.updateLikeOffset();
                },
            );
        } catch (e) {
            if (this.data.fontKey !== fontKey) return;
            const fallback = zmcFont.getFontOption("youmokeban").fallback;
            this.setData(
                {
                    lineRuns: currentLines.map((line) => [
                        { text: line, family: fallback },
                    ]),
                    containerFamily: fallback,
                    fontLoading: false,
                    ...computeScreenLayout(currentLines, currentDetail.type),
                },
                () => {
                    this.updateLikeOffset();
                },
            );
        }
    },

    handleToggleFontMenu() {
        this.setData({ fontMenuOpen: !this.data.fontMenuOpen });
    },

    handleCloseFontMenu() {
        this.setData({ fontMenuOpen: false });
    },

    handleFontChange(e) {
        const { key } = e.currentTarget.dataset;
        if (!key) return;
        if (key === this.data.fontKey) {
            this.setData({ fontMenuOpen: false });
            return;
        }
        zmcFont.saveFontKey(key);
        this.applyFont(key);
    },

    handleAdjacent(e) {
        const { key } = e.currentTarget.dataset;
        if (!key || key === this.data.key) return;
        // 页内切换，避免 redirect 整页重挂 + 等字体才出内容
        this.setData({ fontMenuOpen: false });
        this.loadPage(key);
    },

    clearLikeBurstTimers() {
        (this._likeBurstTimers || []).forEach((timer) => clearTimeout(timer));
        this._likeBurstTimers = [];
    },

    playLikeBurst() {
        this.clearLikeBurstTimers();
        this.setData({
            likeBurst: true,
            likeBurstPhase: "grow",
        });
        this._likeBurstTimers = [
            setTimeout(() => {
                this.setData({ likeBurstPhase: "explode" });
            }, 450),
            setTimeout(() => {
                this.setData({
                    likeBurst: false,
                    likeBurstPhase: "",
                });
                this._likeBurstTimers = [];
            }, 880),
        ];
    },

    async handleToggleLike() {
        const { key, liked, likePending, likeCount } = this.data;
        if (!key || likePending) return;

        const action = liked ? "unlike" : "like";
        if (action === "like") {
            this.playLikeBurst();
        }
        this.setData({ likePending: true });
        try {
            const res = await MX.post("zmc/like", { key, action });
            const nextCount =
                res && res.like_count != null ? Number(res.like_count) : likeCount;
            const nextLiked = action === "like";
            writeLiked(key, nextLiked);
            this.setData({
                liked: nextLiked,
                likeCount: nextCount,
                likePending: false,
            });
        } catch (e) {
            this.setData({ likePending: false });
        }
    },

    onUnload() {
        this.clearLikeBurstTimers();
    },
});
