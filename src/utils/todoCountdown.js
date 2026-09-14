const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function parseEndTime(value) {
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    // YYYY-MM-DD HH:mm:ss → 兼容 iOS
    const normalized = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(raw)
        ? raw.replace(" ", "T")
        : raw;
    const d = new Date(normalized);
    return Number.isNaN(d.getTime()) ? null : d;
}

/** 展示用：2026/08/05 00:00（只到分） */
export function formatDateMinute(value) {
    if (!value) return "";
    const raw = String(value).trim();
    const m = raw.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (m) return `${m[1]}/${m[2]}/${m[3]} ${m[4]}:${m[5]}`;
    return raw;
}

/** 展示用：2026/08/05 00:00:00（到秒） */
export function formatDateSecond(value) {
    if (!value) return "";
    const raw = String(value).trim();
    const m = raw.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (m) return `${m[1]}/${m[2]}/${m[3]} ${m[4]}:${m[5]}:${m[6] || "00"}`;
    return raw;
}

/** 截止时间在 3 天内时展示倒计时；已完成/已取消不展示 */
export function buildCountdown(planEndTime, status) {
    const statusNum = Number(status);
    if (statusNum === 3 || statusNum === 4) {
        return { countdownText: "", countdownState: "" };
    }
    const end = parseEndTime(planEndTime);
    if (!end) {
        return { countdownText: "", countdownState: "" };
    }

    const diffMs = end.getTime() - Date.now();
    if (diffMs > THREE_DAYS_MS) {
        return { countdownText: "", countdownState: "" };
    }

    if (diffMs <= 0) {
        const overdueMs = Math.abs(diffMs);
        const days = Math.floor(overdueMs / 86400000);
        const hours = Math.floor((overdueMs % 86400000) / 3600000);
        const mins = Math.floor((overdueMs % 3600000) / 60000);
        let text = "已逾期";
        if (days > 0) text += `${days}天`;
        if (hours > 0) text += `${hours}小时`;
        if (mins > 0) text += `${mins}分`;
        else if (days === 0 && hours === 0) text += "1分";
        return { countdownText: text, countdownState: "overdue" };
    }

    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    let text = "剩余";
    if (days > 0) text += `${days}天`;
    if (hours > 0) text += `${hours}小时`;
    if (mins > 0) text += `${mins}分`;
    else if (days === 0 && hours === 0) text += "1分";

    return {
        countdownText: text,
        countdownState: days === 0 ? "urgent" : "soon",
    };
}
