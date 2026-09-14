/**
 * @file 流年凝雪前端权限
 * - min：业务数据全可写；喝水/时间仅本人
 * - juan：物品等仅可写 affiliation=2；食品/药品全可写；续费/人事可新增，编辑/删除仅娟
 * - 无权限不渲染写按钮
 */
import { getUserInfo } from "./user";

const AFF_MIN = 1;
const AFF_JUAN = 2;

const getRole = () => {
    const user = getUserInfo() || {};
    return String(user.role || "")
        .trim()
        .toLowerCase();
};

const isMin = () => getRole() === "min";
const isJuan = () => getRole() === "juan";
/** 正式用户：可看底部导航、工具、管理 */
const isStaff = () => isMin() || isJuan();

const normalizeAffiliation = (value) => {
    const n = Number(value);
    return n === AFF_MIN || n === AFF_JUAN ? n : 0;
};

/**
 * 有归属的数据是否可写（物品/衣物/待办/日记/续费/人事）
 * @param {number|string} affiliation
 */
const canWriteAffiliation = (affiliation) => {
    if (!isStaff()) return false;
    const aff = normalizeAffiliation(affiliation);
    if (!aff) return false;
    if (isMin()) return true;
    return aff === AFF_JUAN;
};

/** 食品/药品：min 与 juan 均可写 */
const canWriteShared = () => isStaff();

/**
 * 根据记录判断是否可写
 * - 无 affiliation：食品/药品 → staff 可写
 * - 有 affiliation 1/2：按 canWriteAffiliation
 * - affiliation 空：仅 min
 * @param {object} [record]
 */
const canWriteRecord = (record) => {
    if (!isStaff()) return false;
    if (!record || typeof record !== "object") {
        return canWriteShared();
    }
    if (!Object.prototype.hasOwnProperty.call(record, "affiliation")) {
        return canWriteShared();
    }
    const aff = normalizeAffiliation(record.affiliation);
    if (!aff) {
        return isMin();
    }
    return canWriteAffiliation(aff);
};

/** 有归属模块新增：min/juan */
const canAddOwned = () => isStaff();
/** 食品/药品/续费/人事新增：min/juan */
const canAddShared = () => isStaff();

/** 新增有归属数据时，juan 固定为 2 */
const defaultWriteAffiliation = () => {
    if (isJuan()) return AFF_JUAN;
    const user = getUserInfo() || {};
    const aff = normalizeAffiliation(user.affiliation);
    return aff || AFF_MIN;
};

/** 喝水/时间：仅本人归属（来自登录用户） */
const selfAffiliation = () => {
    const user = getUserInfo() || {};
    const aff = normalizeAffiliation(user.affiliation);
    if (aff) return aff;
    if (isJuan()) return AFF_JUAN;
    if (isMin()) return AFF_MIN;
    return 0;
};

const selfAffiliationName = () => {
    const aff = selfAffiliation();
    if (aff === AFF_MIN) return "敏";
    if (aff === AFF_JUAN) return "娟";
    return "";
};

/** 等待启动登录完成后再算权限，避免 role 未就绪导致按钮误显 */
const waitLnnxReady = async () => {
    try {
        const app = getApp();
        const ready = app && app.globalData && app.globalData.loginReady;
        if (ready && typeof ready.then === "function") {
            await ready;
        }
    } catch (e) {
        // ignore
    }
};

export {
    AFF_MIN,
    AFF_JUAN,
    getRole,
    isMin,
    isJuan,
    isStaff,
    normalizeAffiliation,
    canWriteAffiliation,
    canWriteShared,
    canWriteRecord,
    canAddOwned,
    canAddShared,
    defaultWriteAffiliation,
    selfAffiliation,
    selfAffiliationName,
    waitLnnxReady,
};

export default {
    AFF_MIN,
    AFF_JUAN,
    getRole,
    isMin,
    isJuan,
    isStaff,
    normalizeAffiliation,
    canWriteAffiliation,
    canWriteShared,
    canWriteRecord,
    canAddOwned,
    canAddShared,
    defaultWriteAffiliation,
    selfAffiliation,
    selfAffiliationName,
    waitLnnxReady,
};
