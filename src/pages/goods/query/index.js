import MX from "@utils/index";
import { computeContentHeight } from "@utils/nameSearch";

const MODE_CONFIG = {
    name: {
        title: "按名称查询",
        intro: "输入物品名称开始查询",
        placeholder: "输入物品名称",
        empty: "未找到相关物品",
    },
    category: {
        title: "按分类查询",
        intro: "选择一个物品分类",
        empty: "该分类下暂无物品",
        conditionLabel: "物品分类",
    },
    storage: {
        title: "按存放位置查询",
        intro: "选择一个存放位置",
        empty: "该位置暂无物品",
        conditionLabel: "存放位置",
    },
    owner: {
        title: "按归属人查询",
        intro: "选择物品归属人",
        empty: "该归属人暂无物品",
        conditionLabel: "物品归属人",
    },
};

function buildStorageLevels(options, primaryId, selectedPath = [], labelType = "位置") {
    const childrenMap = {};
    options.forEach((item) => {
        if (!childrenMap[item.parentId]) childrenMap[item.parentId] = [];
        childrenMap[item.parentId].push(item);
    });

    const numberLabels = ["二", "三", "四", "五", "六"];
    const levels = [];
    let parentId = primaryId;
    for (let index = 0; index < numberLabels.length; index += 1) {
        const levelOptions = childrenMap[parentId] || [];
        if (!levelOptions.length) break;
        levels.push({
            level: index + 2,
            label: `${numberLabels[index]}级${labelType}`,
            options: levelOptions,
        });
        const selectedId = selectedPath[index];
        if (!selectedId || !levelOptions.some((item) => item.value === selectedId)) break;
        parentId = selectedId;
    }

    return levels;
}

function resolveStoragePath(options, targetId) {
    const itemMap = {};
    options.forEach((item) => {
        itemMap[item.value] = item;
    });
    const path = [];
    const visited = {};
    let currentId = targetId;
    while (currentId > 0 && itemMap[currentId] && !visited[currentId]) {
        visited[currentId] = true;
        path.push(currentId);
        currentId = itemMap[currentId].parentId;
    }
    path.reverse();
    return {
        primaryId: path[0] || 0,
        selectedPath: path.slice(1),
    };
}

Page({
    data: {
        contentHeight: 600,
        storageListHeight: 500,
        mode: "name",
        config: MODE_CONFIG.name,
        keyword: "",
        options: [],
        primaryOptions: [],
        storageLevels: [],
        selectedStoragePath: [],
        selectedId: 0,
        selectedPrimaryId: 0,
        selectedLabel: "",
        directResult: false,
        optionsLoading: false,
        list: [],
        total: 0,
        page: 1,
        limit: 20,
        loading: false,
        loadingMore: false,
        hasMore: false,
        searched: false,
        empty: false,
    },

    onLoad(options) {
        const contentHeight = computeContentHeight();
        const mode = MODE_CONFIG[options.mode] ? options.mode : "name";
        const ownerId = mode === "owner" ? Number(options.ownerId || 0) : 0;
        const filterId = mode === "category" || mode === "storage" ? Number(options.filterId || 0) : 0;
        const selectedId = ownerId || filterId;
        const directResult = ownerId > 0;
        const ownerName = options.ownerName || (ownerId === 1 ? "敏" : "娟");
        const filterName = options.filterName || "";
        const selectedLabel = selectedId ? decodeURIComponent(ownerId ? ownerName : filterName) : "";
        this.setData({
            contentHeight,
            storageListHeight: Math.max(contentHeight - 110, 400),
            mode,
            config: directResult ? { ...MODE_CONFIG[mode], title: "物品搜索列表" } : MODE_CONFIG[mode],
            selectedId,
            selectedLabel,
            directResult,
        }, () => {
            if (directResult) this.search(true);
        });
        if (mode !== "name" && !directResult) this.loadOptions();
    },

    onShow() {
        wx.setNavigationBarColor({
            frontColor: "#000000",
            backgroundColor: "#ffffff",
        });
    },

    onPullDownRefresh() {
        const tasks = [];
        if (this.data.mode !== "name" && !this.data.directResult) tasks.push(this.loadOptions());
        if (this.data.searched) tasks.push(this.search(true));
        Promise.all(tasks).finally(() => wx.stopPullDownRefresh());
    },

    onReachBottom() {
        if (!this.data.hasMore || this.data.loadingMore || this.data.loading) return;
        this.setData({ page: this.data.page + 1 }, () => this.search(false));
    },

    async loadOptions() {
        const { mode } = this.data;
        if (mode === "owner") {
            this.setData({
                options: [
                    { value: 1, label: "敏", mark: "敏", desc: "查看归属于敏的物品", tone: "blue" },
                    { value: 2, label: "娟", mark: "娟", desc: "查看归属于娟的物品", tone: "purple" },
                ],
            });
            return;
        }

        this.setData({ optionsLoading: true });
        try {
            const endpoint = mode === "category" ? "goods/categories" : "goods/places";
            const rows = await MX.get(endpoint);
            const list = Array.isArray(rows) ? rows : [];
            const mappedOptions = list.map((item) => {
                const label = item.display_name || item.name || `#${item.id}`;
                return {
                    value: Number(item.id) || 0,
                    label,
                    shortLabel: item.name || label,
                    parentId: Number(mode === "category" ? item.parentid : item.parent_id) || 0,
                    level: Math.max(0, label.split(" / ").length - 1),
                };
            });
            const primaryOptions = mode === "storage" || mode === "category"
                ? mappedOptions.filter((item) => item.parentId === 0)
                : [];
            this.setData({
                options: mappedOptions,
                primaryOptions,
                optionsLoading: false,
            }, () => {
                if (mode !== "storage" && mode !== "category") return;
                if (this.data.selectedPrimaryId) {
                    this.setData({
                        storageLevels: buildStorageLevels(
                            mappedOptions,
                            this.data.selectedPrimaryId,
                            this.data.selectedStoragePath,
                            mode === "category" ? "分类" : "位置"
                        ),
                    });
                } else if (this.data.selectedId) {
                    const resolved = resolveStoragePath(mappedOptions, this.data.selectedId);
                    this.setData({
                        selectedPrimaryId: resolved.primaryId,
                        selectedStoragePath: resolved.selectedPath,
                        storageLevels: buildStorageLevels(
                            mappedOptions,
                            resolved.primaryId,
                            resolved.selectedPath,
                            mode === "category" ? "分类" : "位置"
                        ),
                    }, () => this.search(true));
                } else if (!this.data.selectedId && primaryOptions.length) {
                    const first = primaryOptions[0];
                    this.setData({
                        selectedId: first.value,
                        selectedPrimaryId: first.value,
                        selectedLabel: first.label,
                        storageLevels: buildStorageLevels(
                            mappedOptions,
                            first.value,
                            [],
                            mode === "category" ? "分类" : "位置"
                        ),
                        selectedStoragePath: [],
                    }, () => this.search(true));
                }
            });
        } catch (e) {
            this.setData({ options: [], optionsLoading: false });
        }
    },

    handleKeywordInput(e) {
        this.setData({ keyword: e.detail.value || "" });
    },

    handleClearKeyword() {
        if ((this.data.mode === "storage" || this.data.mode === "category") && this.data.selectedId) {
            this.setData({ keyword: "" }, () => this.search(true));
            return;
        }
        this.setData({
            keyword: "",
            list: [],
            total: 0,
            searched: false,
            empty: false,
            hasMore: false,
            page: 1,
        });
    },

    handleSearch() {
        if (this.data.mode === "name" && !this.data.keyword.trim()) {
            wx.showToast({ title: "请输入物品名称", icon: "none" });
            return;
        }
        this.search(true);
    },

    handleOptionTap(e) {
        const selectedId = Number(e.currentTarget.dataset.value);
        const selectedLabel = e.currentTarget.dataset.label || "";
        if (!selectedId) return;
        if (this.data.mode === "owner" && !this.data.directResult) {
            wx.navigateTo({
                url: `/pages/goods/query/index?mode=owner&ownerId=${selectedId}&ownerName=${encodeURIComponent(selectedLabel)}`,
            });
            return;
        }
        this.setData({ selectedId, selectedLabel }, () => this.search(true));
    },

    handleStoragePrimary(e) {
        const selectedId = Number(e.currentTarget.dataset.value);
        const selectedLabel = e.currentTarget.dataset.label || "";
        if (!selectedId) return;
        this.setData({
            selectedId,
            selectedPrimaryId: selectedId,
            selectedLabel,
            storageLevels: buildStorageLevels(
                this.data.options,
                selectedId,
                [],
                this.data.mode === "category" ? "分类" : "位置"
            ),
            selectedStoragePath: [],
        }, () => this.search(true));
    },

    handleStorageNode(e) {
        const selectedId = Number(e.currentTarget.dataset.value);
        const selectedLabel = e.currentTarget.dataset.label || "";
        const levelIndex = Number(e.currentTarget.dataset.levelIndex);
        if (!selectedId) return;
        const selectedStoragePath = this.data.selectedStoragePath.slice(0, levelIndex);
        selectedStoragePath[levelIndex] = selectedId;
        this.setData({
            selectedId,
            selectedLabel,
            selectedStoragePath,
            storageLevels: buildStorageLevels(
                this.data.options,
                this.data.selectedPrimaryId,
                selectedStoragePath,
                this.data.mode === "category" ? "分类" : "位置"
            ),
        }, () => this.search(true));
    },

    handleLoadMore() {
        if (!this.data.hasMore || this.data.loadingMore || this.data.loading) return;
        this.setData({ page: this.data.page + 1 }, () => this.search(false));
    },

    async search(reset = true) {
        const { mode, selectedId } = this.data;
        const keyword = this.data.keyword.trim();
        if (mode === "name" && !keyword) {
            wx.showToast({ title: "请输入物品名称", icon: "none" });
            return;
        }
        if (mode !== "name" && !selectedId) {
            wx.showToast({ title: this.data.config.intro, icon: "none" });
            return;
        }

        const page = reset ? 1 : this.data.page;
        this.setData({ loading: reset, loadingMore: !reset, searched: true });

        try {
            const params = { page, limit: this.data.limit };
            if (keyword) params.name = keyword;
            if (mode === "category") params.category_id = selectedId;
            if (mode === "storage") params.storage_id = selectedId;
            if (mode === "owner") params.affiliation = selectedId;

            const data = await MX.get("goods/list", params);
            const rows = Array.isArray(data?.list) ? data.list : [];
            const total = Number(data?.total) || 0;
            const list = reset ? rows : this.data.list.concat(rows);
            this.setData({
                list,
                total,
                page,
                hasMore: list.length < total,
                empty: list.length === 0,
                loading: false,
                loadingMore: false,
            });
        } catch (e) {
            this.setData({
                loading: false,
                loadingMore: false,
                empty: reset ? true : this.data.empty,
                list: reset ? [] : this.data.list,
            });
        }
    },

    handleDetail(e) {
        const { id } = e.currentTarget.dataset;
        if (!id) return;
        MX.go(`/pages/goods/detail/index?id=${id}`);
    },
});
