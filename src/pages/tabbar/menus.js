/** 主包底部导航（首页 / 工具 / 管理）——仅 min / juan 可见 */
import { isStaff } from "@utils/lnnxPermission";

const TAB_MENUS = [
    {
        text: "首页",
        iconName: "home",
        url: "/pages/zmc/index",
    },
    {
        text: "工具",
        iconName: "classify",
        url: "/pages/tools/index",
    },
    {
        text: "管理",
        iconName: "setting",
        url: "/pages/manage/index",
    },
];

/**
 * 按当前登录角色返回底部菜单；非 min/juan 返回空
 * @returns {typeof TAB_MENUS}
 */
const getTabMenus = () => (isStaff() ? TAB_MENUS.slice() : []);

/**
 * 工具 / 管理页守卫：非正式用户回首页
 * @returns {Promise<boolean>} 是否允许进入
 */
const ensureStaffPage = async () => {
    try {
        const app = getApp();
        if (app && app.globalData && app.globalData.loginReady) {
            await app.globalData.loginReady;
        }
    } catch (e) {
        // ignore
    }
    if (isStaff()) return true;
    wx.reLaunch({ url: "/pages/zmc/index" });
    return false;
};

export { TAB_MENUS, getTabMenus, ensureStaffPage };
export default TAB_MENUS;
