import MX from "@utils/index";
import TAB_MENUS from "../menus";

Page({
    data: {
        menus: TAB_MENUS,
    },
    goGoodsList() {
        MX.go("/packageDemo/goods-list/index");
    },
});
