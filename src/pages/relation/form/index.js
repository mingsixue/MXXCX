import MX from "@utils/index";

const AFFILIATION = [
    { label: "敏", value: 1 },
    { label: "娟", value: 2 },
];

const TYPE = { 1: "亲属", 2: "朋友", 3: "同学", 4: "同事", 5: "陌生人" };
const GENDER = { 1: "男", 2: "女" };
const MARRIAGE = { 1: "未婚", 2: "已婚", 3: "离异", 4: "再婚" };
const CONSTELLATION = {
    1: "白羊座",
    2: "金牛座",
    3: "双子座",
    4: "巨蟹座",
    5: "狮子座",
    6: "处女座",
    7: "天秤座",
    8: "天蝎座",
    9: "射手座",
    10: "摩羯座",
    11: "水瓶座",
    12: "双鱼座",
};
const EMPTY_OPTION = { label: "不选", value: 0 };

function mapOptions(map, withEmpty = false) {
    const list = Object.keys(map).map((k) => ({ label: map[k], value: Number(k) }));
    return withEmpty ? [EMPTY_OPTION].concat(list) : list;
}

function findIndex(options, value, fallback = 0) {
    const idx = options.findIndex((o) => Number(o.value) === Number(value));
    return idx >= 0 ? idx : fallback;
}

function toDateOnly(v) {
    if (!v) return "";
    return String(v).slice(0, 10);
}

function buildPhotos(keysStr, urls) {
    const keys = String(keysStr || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    const list = Array.isArray(urls) ? urls : [];
    return keys.map((key, i) => ({ key, url: list[i] || "" }));
}

function parseIdList(str) {
    return String(str || "")
        .split(",")
        .map((s) => Number(String(s).trim()))
        .filter((n) => n > 0);
}

function markTagOptions(allTags, selectedIds) {
    const selected = new Set((selectedIds || []).map(Number));
    return (allTags || []).map((tag) => ({
        ...tag,
        selected: selected.has(Number(tag.id)),
    }));
}

function buildSelectedTags(allTags, selectedIds) {
    const selected = new Set((selectedIds || []).map(Number));
    return (allTags || []).filter((tag) => selected.has(Number(tag.id)));
}

function buildTagTypeTabs(allTags) {
    const map = new Map();
    (allTags || []).forEach((tag) => {
        const type = Number(tag.type) || 0;
        if (!map.has(type)) {
            map.set(type, {
                value: type,
                label: tag.type_text || "其他",
            });
        }
    });
    const tabs = Array.from(map.values()).sort((a, b) => a.value - b.value);
    return [{ value: 0, label: "全部" }].concat(tabs);
}

function buildTagGroups(allTags, selectedIds, keyword = "", typeFilter = 0) {
    const kw = String(keyword || "").trim().toLowerCase();
    const selected = new Set((selectedIds || []).map(Number));
    const filtered = (allTags || []).filter((tag) => {
        if (typeFilter && Number(tag.type) !== Number(typeFilter)) return false;
        if (!kw) return true;
        return String(tag.name || "")
            .toLowerCase()
            .includes(kw);
    });
    const groups = [];
    const indexMap = new Map();
    filtered.forEach((tag) => {
        const type = Number(tag.type) || 0;
        let group = indexMap.get(type);
        if (!group) {
            group = {
                type,
                type_text: tag.type_text || "",
                tags: [],
            };
            indexMap.set(type, group);
            groups.push(group);
        }
        group.tags.push({
            ...tag,
            selected: selected.has(Number(tag.id)),
        });
    });
    return groups;
}

function buildTagViewState(allTags, selectedIds, keyword = "", typeFilter = 0) {
    return {
        selectedTags: buildSelectedTags(allTags, selectedIds),
        tagOptions: markTagOptions(allTags, selectedIds),
        tagTypeTabs: buildTagTypeTabs(allTags),
        tagGroups: buildTagGroups(allTags, selectedIds, keyword, typeFilter),
    };
}

Page({
    data: {
        title: "新增人事",
        isEdit: false,
        id: 0,
        loading: false,
        submitting: false,

        name: "",
        smallName: "",
        formerName: "",
        sobriquet: "",
        gender: 0,
        genderIndex: 0,
        genderOptions: mapOptions(GENDER, true),
        type: 0,
        typeIndex: 0,
        typeOptions: mapOptions(TYPE, true),
        nation: "",
        year: "",
        nativePlace: "",
        nativePlaceAddress: "",
        ancestralHome: "",
        settlement: "",
        address: "",
        interests: "",

        dateOfBirth: "",
        birthday: "",
        lunarBirthday: "",
        constellation: 0,
        constellationIndex: 0,
        constellationOptions: mapOptions(CONSTELLATION, true),
        chineseZodiac: "",
        dieDay: "",
        dieReason: "",

        phone: "",
        wechat: "",
        qq: "",
        email: "",

        marriage: 0,
        marriageIndex: 0,
        marriageOptions: mapOptions(MARRIAGE, true),
        spouse: "",
        children: "",
        parents: "",
        family: "",

        company: "",
        department: "",
        job: "",
        entryDate: "",
        workExperience: "",

        school: "",
        major: "",
        education: "",
        graduationDate: "",
        classAndGrade: "",
        classPost: "",
        educationExperience: "",

        channel: "",
        firstDate: "",
        desc: "",
        remark: "",

        photos: [],
        affiliation: 1,
        affiliationIndex: 0,
        affiliationOptions: AFFILIATION,
        affiliationLocked: false,

        // 标签
        allTags: [],
        tagOptions: [],
        selectedTagIds: [],
        selectedTags: [],
        tagPopupVisible: false,
        tagKeyword: "",
        tagTypeFilter: 0,
        tagTypeTabs: [{ value: 0, label: "全部" }],
        tagGroups: [],

        // 关联人
        affiliatedPeople: [],
        affKeyword: "",
        affSearching: false,
        affResults: [],
    },

    onLoad(options) {
        const id = Number(options.id || 0);
        const affiliationLocked = MX.isJuan();
        const defaultAff = MX.defaultWriteAffiliation();
        const affBase = {
            affiliationLocked,
            affiliation: defaultAff,
            affiliationIndex: findIndex(AFFILIATION, defaultAff),
        };
        if (id > 0) {
            this.setData({
                ...affBase,
                id,
                isEdit: true,
                title: "编辑人事",
                loading: true,
            });
        } else {
            if (!MX.canAddShared()) {
                wx.showToast({ title: "无权限新增", icon: "none" });
                setTimeout(() => MX.back(), 500);
                return;
            }
            this.setData({ ...affBase, loading: true });
        }
        this.init(id);
    },

    onShow() {
        wx.setNavigationBarColor({
            frontColor: "#000000",
            backgroundColor: "#f5f6f8",
        });
    },

    async init(id) {
        try {
            await this.loadTags();
            if (id > 0) {
                await this.loadDetail(id);
            }
        } finally {
            this.setData({ loading: false });
        }
    },

    async loadTags() {
        try {
            const rows = await MX.get("relation/tags");
            const allTags = (Array.isArray(rows) ? rows : [])
                .map((item) => ({
                    id: Number(item.id) || 0,
                    name: item.name || "",
                    type: Number(item.type) || 0,
                    type_text: item.type_text || "",
                }))
                .filter((item) => item.id && item.name);
            this.setData({
                allTags,
                ...buildTagViewState(
                    allTags,
                    this.data.selectedTagIds,
                    this.data.tagKeyword,
                    this.data.tagTypeFilter
                ),
            });
        } catch (e) {
            this.setData({
                allTags: [],
                ...buildTagViewState([], [], "", 0),
            });
        }
    },

    async loadDetail(id) {
        const detail = await MX.get("relation/detail", { id });
        if (!detail || !detail.id) {
            wx.showToast({ title: "记录不存在", icon: "none" });
            return;
        }
        if (!MX.canWriteRecord(detail)) {
            wx.showToast({ title: "无权限编辑", icon: "none" });
            setTimeout(() => MX.back(), 500);
            return;
        }
        const gender = Number(detail.gender) || 0;
        const affiliation = MX.isJuan()
            ? 2
            : MX.normalizeAffiliation(detail.affiliation) || MX.defaultWriteAffiliation();
        const type = Number(detail.type) || 0;
        const marriage = Number(detail.marriage) || 0;
        const constellation = Number(detail.constellation) || 0;
        const selectedTagIds = parseIdList(detail.tags);
        const affiliatedPeople = (Array.isArray(detail.affiliated_people)
            ? detail.affiliated_people
            : []
        )
            .map((p) => ({
                id: Number(p.id) || 0,
                name: p.name || (p.id ? `#${p.id}` : ""),
            }))
            .filter((p) => p.id && p.name);

        this.setData({
            name: detail.name || "",
            smallName: detail.small_name || "",
            formerName: detail.former_name || "",
            sobriquet: detail.sobriquet || "",
            gender,
            genderIndex: findIndex(this.data.genderOptions, gender),
            type,
            typeIndex: findIndex(this.data.typeOptions, type),
            nation: detail.nation || "",
            year: detail.year || "",
            nativePlace: detail.native_place || "",
            nativePlaceAddress: detail.native_place_address || "",
            ancestralHome: detail.ancestral_home || "",
            settlement: detail.settlement || "",
            address: detail.address || "",
            interests: detail.interests_and_hobbies || "",
            dateOfBirth: toDateOnly(detail.date_of_birth),
            birthday: detail.birthday || "",
            lunarBirthday: detail.lunar_birthday || "",
            constellation,
            constellationIndex: findIndex(this.data.constellationOptions, constellation),
            chineseZodiac: detail.chinese_zodiac || "",
            dieDay: toDateOnly(detail.die_day),
            dieReason: detail.die_reason || "",
            phone: detail.phone || "",
            wechat: detail.wechat || "",
            qq: detail.qq || "",
            email: detail.email || "",
            marriage,
            marriageIndex: findIndex(this.data.marriageOptions, marriage),
            spouse: detail.spouse || "",
            children: detail.children || "",
            parents: detail.parents || "",
            family: detail.family || "",
            company: detail.company || "",
            department: detail.department || "",
            job: detail.job || "",
            entryDate: toDateOnly(detail.entry_date),
            workExperience: detail.work_experience || "",
            school: detail.school || "",
            major: detail.major || "",
            education: detail.education || "",
            graduationDate: detail.graduation_date || "",
            classAndGrade: detail.class_and_grade || "",
            classPost: detail.class_post || "",
            educationExperience: detail.education_experience || "",
            channel: detail.channel || "",
            firstDate: toDateOnly(detail.first_date),
            desc: detail.desc || "",
            remark: detail.remark || "",
            photos: buildPhotos(detail.photo, detail.photo_urls),
            affiliation,
            affiliationIndex: findIndex(AFFILIATION, affiliation),
            selectedTagIds,
            ...buildTagViewState(
                this.data.allTags,
                selectedTagIds,
                this.data.tagKeyword,
                this.data.tagTypeFilter
            ),
            affiliatedPeople,
        });
    },

    onNameChange(e) {
        this.setData({ name: (e.detail && e.detail.value) || "" });
    },
    onSmallNameChange(e) {
        this.setData({ smallName: (e.detail && e.detail.value) || "" });
    },
    onFormerNameChange(e) {
        this.setData({ formerName: (e.detail && e.detail.value) || "" });
    },
    onSobriquetChange(e) {
        this.setData({ sobriquet: (e.detail && e.detail.value) || "" });
    },
    onNationChange(e) {
        this.setData({ nation: (e.detail && e.detail.value) || "" });
    },
    onYearChange(e) {
        this.setData({ year: (e.detail && e.detail.value) || "" });
    },
    onNativePlaceChange(e) {
        this.setData({ nativePlace: (e.detail && e.detail.value) || "" });
    },
    onNativePlaceAddressChange(e) {
        this.setData({ nativePlaceAddress: (e.detail && e.detail.value) || "" });
    },
    onAncestralHomeChange(e) {
        this.setData({ ancestralHome: (e.detail && e.detail.value) || "" });
    },
    onSettlementChange(e) {
        this.setData({ settlement: (e.detail && e.detail.value) || "" });
    },
    onAddressChange(e) {
        this.setData({ address: (e.detail && e.detail.value) || "" });
    },
    onInterestsChange(e) {
        this.setData({ interests: (e.detail && e.detail.value) || "" });
    },
    onBirthdayChange(e) {
        this.setData({ birthday: (e.detail && e.detail.value) || "" });
    },
    onLunarBirthdayChange(e) {
        this.setData({ lunarBirthday: (e.detail && e.detail.value) || "" });
    },
    onChineseZodiacChange(e) {
        this.setData({ chineseZodiac: (e.detail && e.detail.value) || "" });
    },
    onDieReasonChange(e) {
        this.setData({ dieReason: (e.detail && e.detail.value) || "" });
    },
    onPhoneChange(e) {
        this.setData({ phone: (e.detail && e.detail.value) || "" });
    },
    onWechatChange(e) {
        this.setData({ wechat: (e.detail && e.detail.value) || "" });
    },
    onQqChange(e) {
        this.setData({ qq: (e.detail && e.detail.value) || "" });
    },
    onEmailChange(e) {
        this.setData({ email: (e.detail && e.detail.value) || "" });
    },
    onSpouseChange(e) {
        this.setData({ spouse: (e.detail && e.detail.value) || "" });
    },
    onChildrenChange(e) {
        this.setData({ children: (e.detail && e.detail.value) || "" });
    },
    onParentsChange(e) {
        this.setData({ parents: (e.detail && e.detail.value) || "" });
    },
    onFamilyChange(e) {
        this.setData({ family: (e.detail && e.detail.value) || "" });
    },
    onCompanyChange(e) {
        this.setData({ company: (e.detail && e.detail.value) || "" });
    },
    onDepartmentChange(e) {
        this.setData({ department: (e.detail && e.detail.value) || "" });
    },
    onJobChange(e) {
        this.setData({ job: (e.detail && e.detail.value) || "" });
    },
    onWorkExperienceChange(e) {
        this.setData({ workExperience: (e.detail && e.detail.value) || "" });
    },
    onSchoolChange(e) {
        this.setData({ school: (e.detail && e.detail.value) || "" });
    },
    onMajorChange(e) {
        this.setData({ major: (e.detail && e.detail.value) || "" });
    },
    onEducationChange(e) {
        this.setData({ education: (e.detail && e.detail.value) || "" });
    },
    onGraduationDateChange(e) {
        this.setData({ graduationDate: (e.detail && e.detail.value) || "" });
    },
    onClassAndGradeChange(e) {
        this.setData({ classAndGrade: (e.detail && e.detail.value) || "" });
    },
    onClassPostChange(e) {
        this.setData({ classPost: (e.detail && e.detail.value) || "" });
    },
    onEducationExperienceChange(e) {
        this.setData({ educationExperience: (e.detail && e.detail.value) || "" });
    },
    onChannelChange(e) {
        this.setData({ channel: (e.detail && e.detail.value) || "" });
    },
    onDescChange(e) {
        this.setData({ desc: (e.detail && e.detail.value) || "" });
    },
    onRemarkChange(e) {
        this.setData({ remark: (e.detail && e.detail.value) || "" });
    },

    onPickerChange(field, indexField, optionsKey) {
        return (e) => {
            if (!(e.detail && e.detail.type === "selector")) return;
            const index = Number(e.detail.value) || 0;
            const opt = this.data[optionsKey][index];
            this.setData({
                [indexField]: index,
                [field]: opt ? opt.value : 0,
            });
        };
    },

    onGenderChange(e) {
        this.onPickerChange("gender", "genderIndex", "genderOptions")(e);
    },
    onTypeChange(e) {
        this.onPickerChange("type", "typeIndex", "typeOptions")(e);
    },
    onMarriageChange(e) {
        this.onPickerChange("marriage", "marriageIndex", "marriageOptions")(e);
    },
    onConstellationChange(e) {
        this.onPickerChange("constellation", "constellationIndex", "constellationOptions")(e);
    },
    onAffiliationChange(e) {
        if (this.data.affiliationLocked) return;
        this.onPickerChange("affiliation", "affiliationIndex", "affiliationOptions")(e);
    },

    onDateOfBirthChange(e) {
        if (e.detail && e.detail.type === "date") {
            this.setData({ dateOfBirth: e.detail.date || "" });
        }
    },
    onDieDayChange(e) {
        if (e.detail && e.detail.type === "date") {
            this.setData({ dieDay: e.detail.date || "" });
        }
    },
    onEntryDateChange(e) {
        if (e.detail && e.detail.type === "date") {
            this.setData({ entryDate: e.detail.date || "" });
        }
    },
    onFirstDateChange(e) {
        if (e.detail && e.detail.type === "date") {
            this.setData({ firstDate: e.detail.date || "" });
        }
    },

    async handleAddPhoto() {
        const remain = 3 - this.data.photos.length;
        if (remain <= 0) return;
        try {
            const result = await MX.chooseAndUploadLnnxImage({ module: "relation", count: remain });
            const list = Array.isArray(result) ? result : result ? [result] : [];
            this.setData({ photos: this.data.photos.concat(list) });
        } catch (e) {
            if (e && e.errMsg && String(e.errMsg).indexOf("cancel") >= 0) return;
            wx.showToast({ title: (e && e.message) || "上传失败", icon: "none" });
        }
    },

    handlePreviewPhoto(e) {
        const index = Number(e.currentTarget.dataset.index);
        const urls = (this.data.photos || []).map((p) => p && p.url).filter(Boolean);
        if (!urls.length) return;
        wx.previewImage({
            current: urls[index] || urls[0],
            urls,
        });
    },

    handleRemovePhoto(e) {
        const index = Number(e.currentTarget.dataset.index);
        if (Number.isNaN(index)) return;
        const photos = this.data.photos.slice();
        photos.splice(index, 1);
        this.setData({ photos });
    },

    handleOpenTagPopup() {
        if (!(this.data.allTags || []).length) {
            wx.showToast({ title: "暂无标签可选", icon: "none" });
            return;
        }
        this.setData({
            tagPopupVisible: true,
            ...buildTagViewState(
                this.data.allTags,
                this.data.selectedTagIds,
                this.data.tagKeyword,
                this.data.tagTypeFilter
            ),
        });
    },

    handleCloseTagPopup() {
        this.setData({ tagPopupVisible: false });
    },

    onTagKeywordChange(e) {
        const tagKeyword = (e.detail && e.detail.value) || "";
        this.setData({
            tagKeyword,
            ...buildTagViewState(
                this.data.allTags,
                this.data.selectedTagIds,
                tagKeyword,
                this.data.tagTypeFilter
            ),
        });
    },

    handleTagTypeFilter(e) {
        const tagTypeFilter = Number(e.currentTarget.dataset.value) || 0;
        this.setData({
            tagTypeFilter,
            ...buildTagViewState(
                this.data.allTags,
                this.data.selectedTagIds,
                this.data.tagKeyword,
                tagTypeFilter
            ),
        });
    },

    handleToggleTag(e) {
        const id = Number(e.currentTarget.dataset.id);
        if (!id) return;
        const selected = new Set(this.data.selectedTagIds.map(Number));
        if (selected.has(id)) {
            selected.delete(id);
        } else {
            selected.add(id);
        }
        const selectedTagIds = Array.from(selected);
        this.setData({
            selectedTagIds,
            ...buildTagViewState(
                this.data.allTags,
                selectedTagIds,
                this.data.tagKeyword,
                this.data.tagTypeFilter
            ),
        });
    },

    onAffKeywordInput(e) {
        this.setData({ affKeyword: (e.detail && e.detail.value) || "" });
    },

    handleClearAffKeyword() {
        this.setData({ affKeyword: "", affResults: [] });
    },

    async handleSearchAffiliated() {
        const keyword = (this.data.affKeyword || "").trim();
        if (!keyword) {
            wx.showToast({ title: "请输入姓名搜索", icon: "none" });
            return;
        }
        this.setData({ affSearching: true });
        try {
            const data = await MX.get("relation/list", {
                name: keyword,
                page: 1,
                limit: 30,
            });
            const selectedIds = new Set(this.data.affiliatedPeople.map((p) => Number(p.id)));
            const selfId = Number(this.data.id) || 0;
            const affResults = (Array.isArray(data?.list) ? data.list : [])
                .map((item) => {
                    const photoUrls = Array.isArray(item.photo_urls)
                        ? item.photo_urls.filter(Boolean)
                        : [];
                    return {
                        id: Number(item.id) || 0,
                        name: item.name || "",
                        type_text: item.type_text || "",
                        gender_text: item.gender_text || "",
                        avatar: photoUrls[0] || "",
                    };
                })
                .filter((item) => item.id && item.name && item.id !== selfId && !selectedIds.has(item.id));
            this.setData({ affResults, affSearching: false });
            if (!affResults.length) {
                wx.showToast({ title: "未找到可添加的人员", icon: "none" });
            }
        } catch (e) {
            this.setData({ affSearching: false, affResults: [] });
        }
    },

    handleAddAffiliated(e) {
        const id = Number(e.currentTarget.dataset.id);
        const name = e.currentTarget.dataset.name || "";
        if (!id || !name) return;
        if (id === Number(this.data.id)) {
            wx.showToast({ title: "不能关联自己", icon: "none" });
            return;
        }
        if (this.data.affiliatedPeople.some((p) => Number(p.id) === id)) {
            return;
        }
        const affiliatedPeople = this.data.affiliatedPeople.concat([{ id, name }]);
        const affResults = this.data.affResults.filter((p) => Number(p.id) !== id);
        this.setData({ affiliatedPeople, affResults });
    },

    handleRemoveAffiliated(e) {
        const id = Number(e.currentTarget.dataset.id);
        if (!id) return;
        this.setData({
            affiliatedPeople: this.data.affiliatedPeople.filter((p) => Number(p.id) !== id),
        });
    },

    buildPayload() {
        const d = this.data;
        const payload = {
            name: (d.name || "").trim(),
            small_name: (d.smallName || "").trim(),
            former_name: (d.formerName || "").trim(),
            sobriquet: (d.sobriquet || "").trim(),
            gender: d.gender || "",
            type: d.type || "",
            nation: (d.nation || "").trim(),
            year: (d.year || "").trim(),
            native_place: (d.nativePlace || "").trim(),
            native_place_address: (d.nativePlaceAddress || "").trim(),
            ancestral_home: (d.ancestralHome || "").trim(),
            settlement: (d.settlement || "").trim(),
            address: (d.address || "").trim(),
            interests_and_hobbies: (d.interests || "").trim(),
            date_of_birth: d.dateOfBirth || "",
            birthday: (d.birthday || "").trim(),
            lunar_birthday: (d.lunarBirthday || "").trim(),
            constellation: d.constellation || "",
            chinese_zodiac: (d.chineseZodiac || "").trim(),
            die_day: d.dieDay || "",
            die_reason: (d.dieReason || "").trim(),
            phone: (d.phone || "").trim(),
            wechat: (d.wechat || "").trim(),
            qq: (d.qq || "").trim(),
            email: (d.email || "").trim(),
            marriage: d.marriage || "",
            spouse: (d.spouse || "").trim(),
            children: (d.children || "").trim(),
            parents: (d.parents || "").trim(),
            family: (d.family || "").trim(),
            company: (d.company || "").trim(),
            department: (d.department || "").trim(),
            job: (d.job || "").trim(),
            entry_date: d.entryDate || "",
            work_experience: (d.workExperience || "").trim(),
            school: (d.school || "").trim(),
            major: (d.major || "").trim(),
            education: (d.education || "").trim(),
            graduation_date: (d.graduationDate || "").trim(),
            class_and_grade: (d.classAndGrade || "").trim(),
            class_post: (d.classPost || "").trim(),
            education_experience: (d.educationExperience || "").trim(),
            channel: (d.channel || "").trim(),
            first_date: d.firstDate || "",
            desc: (d.desc || "").trim(),
            remark: (d.remark || "").trim(),
            photo: d.photos.map((p) => p.key).join(","),
            tags: (d.selectedTagIds || []).join(","),
            affiliated_person: (d.affiliatedPeople || []).map((p) => p.id).join(","),
            affiliation: MX.isJuan() ? 2 : d.affiliation || 1,
        };
        return payload;
    },

    async handleSubmit() {
        if (this.data.submitting) return;
        const name = (this.data.name || "").trim();
        if (!name) {
            wx.showToast({ title: "请填写姓名", icon: "none" });
            return;
        }

        const payload = this.buildPayload();
        this.setData({ submitting: true });
        try {
            if (this.data.isEdit) {
                await MX.post("relation/edit", { ...payload, id: this.data.id });
                wx.showToast({ title: "保存成功", icon: "success" });
            } else {
                await MX.post("relation/add", payload);
                wx.showToast({ title: "新增成功", icon: "success" });
            }
            setTimeout(() => MX.back(), 500);
        } catch (e) {
            // request 已提示
        } finally {
            this.setData({ submitting: false });
        }
    },
});
