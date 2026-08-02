Page({
    data: {
        goodsId: "",
        current: 0,
        shareVisible: false,
        shareImage: "",
        banners: [
            { img: "https://img.yzcdn.cn/vant/apple-1.jpg" },
            { img: "https://img.yzcdn.cn/vant/apple-2.jpg" },
            { img: "https://img.yzcdn.cn/vant/apple-3.jpg" },
        ],
        footIcons: [
            { iconName: "service", text: "客服", iconSize: 44 },
            { iconName: "cart", text: "购物车", iconSize: 44 },
            { iconName: "share", text: "分享", iconSize: 44 },
        ],
        detail: {
            title: "示例商品 · 轻便百搭日常款",
            price: "99.00",
            originPrice: "159.00",
            sales: "1.2万+",
            desc: "商品详情模版，可替换为真实接口数据。支持轮播、参数、服务与图文详情展示。",
            tags: ["包邮", "七天无理由", "正品保障"],
            specs: [
                { label: "品牌", value: "MXXCX Demo" },
                { label: "产地", value: "中国" },
                { label: "材质", value: "棉质混纺" },
                { label: "尺码", value: "S / M / L / XL" },
                { label: "颜色", value: "米白 / 雾蓝 / 炭灰" },
            ],
            services: ["极速发货", "坏单包赔", "售后无忧"],
            detailText:
                "这里是图文详情区域示例文案。业务侧可改为富文本、组件化楼层或接口下发的详情图片列表。",
            detailImages: ["详情图占位 1", "详情图占位 2", "详情图占位 3"],
        },
    },

    onLoad(options = {}) {
        const goodsId = options.id || "demo";
        const shareImage = (this.data.banners[0] && this.data.banners[0].img) || "";
        this.setData({ goodsId, shareImage });
        wx.showShareMenu({
            withShareTicket: true,
            menus: ["shareAppMessage"],
        });
    },

    onShareAppMessage() {
        const { detail, goodsId, shareImage } = this.data;
        return {
            title: `${detail.title} ¥${detail.price}`,
            path: `/packageDemo/goods/index?id=${goodsId}`,
            imageUrl: shareImage,
        };
    },

    onSwiperChange(e) {
        const current = (e.detail && e.detail.current) || 0;
        this.setData({ current });
    },

    openShare() {
        this.setData({ shareVisible: true });
    },

    onShareClose() {
        this.setData({ shareVisible: false });
    },

    onShareWechat() {
        this.setData({ shareVisible: false });
    },

    onCopyLink() {
        const { goodsId } = this.data;
        const link = `/packageDemo/goods/index?id=${goodsId}`;
        wx.setClipboardData({
            data: link,
            success: () => {
                wx.showToast({ title: "链接已复制", icon: "none" });
            },
        });
        this.setData({ shareVisible: false });
    },

    onFootIcon(e) {
        const { item } = e.detail || {};
        const text = (item && item.text) || "";
        if (text === "分享") {
            this.openShare();
            return;
        }
        wx.showToast({
            title: text === "客服" ? "联系客服" : text || "操作",
            icon: "none",
        });
    },

    onAddCart() {
        wx.showToast({ title: "已加入购物车", icon: "none" });
    },

    onBuy() {
        wx.showToast({ title: "去下单", icon: "none" });
    },
});
