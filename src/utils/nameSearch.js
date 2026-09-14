/**
 * 名称查询页公共方法（物品/药品/食品）
 */
export function computeContentHeight() {
    const info = wx.getSystemInfoSync();
    const windowHeight = info.windowHeight || 667;
    const statusBarHeight = info.statusBarHeight || 20;
    const navHeight = statusBarHeight + 46;
    return Math.max(windowHeight - navHeight, 480);
}

export function hasText(v) {
    return v != null && String(v).trim() !== "";
}

/** 展示用日期：YYYY-MM-DD → YYYY/MM/DD */
export function formatDateSlash(dateValue) {
    const text = String(dateValue || "").trim();
    if (!text) return "";
    return text.slice(0, 10).replace(/-/g, "/");
}

export function getExpiryStatus(dateValue) {
    if (!dateValue) {
        return {
            remainingDays: null,
            remainingText: "",
            remainingState: "",
            remainingUrgent: false,
        };
    }
    const parts = String(dateValue)
        .slice(0, 10)
        .replace(/\//g, "-")
        .split("-")
        .map(Number);
    if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
        return {
            remainingDays: null,
            remainingText: "",
            remainingState: "",
            remainingUrgent: false,
        };
    }

    const today = new Date();
    const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const expiryTime = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
    const remainingDays = Math.round((expiryTime - todayTime) / 86400000);
    const remainingUrgent = remainingDays >= 0 && remainingDays < 3;

    if (remainingDays > 0) {
        return {
            remainingDays,
            remainingText: `剩余 ${remainingDays} 天`,
            remainingState: remainingUrgent ? "urgent" : "future",
            remainingUrgent,
        };
    }
    if (remainingDays === 0) {
        return {
            remainingDays,
            remainingText: "今天到期",
            remainingState: "urgent",
            remainingUrgent: true,
        };
    }
    return {
        remainingDays,
        remainingText: `已过期 ${Math.abs(remainingDays)} 天`,
        remainingState: "expired",
        remainingUrgent: false,
    };
}

export function pushField(rows, label, value, opts = {}) {
    if (!hasText(value) && !opts.keepEmpty) return;
    rows.push({
        label,
        value: hasText(value) ? String(value) : "-",
        multiline: !!opts.multiline,
        linkId: opts.linkId || 0,
        copyable: !!opts.copyable,
        key: opts.key || label,
    });
}

export function mapTypeTabs(textMap, allLabel = "全部") {
    const tabs = [{ value: 0, label: allLabel }];
    Object.keys(textMap)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach((value) => {
            tabs.push({ value, label: textMap[value] });
        });
    return tabs;
}
