import MX from "@utils/index";
import { computeContentHeight, pushField } from "@utils/nameSearch";

const TAG_PALETTE = [
    { bg: "#e6f4ff", color: "#1677ff" },
    { bg: "#f6ffed", color: "#389e0d" },
    { bg: "#fff1f0", color: "#cf1322" },
    { bg: "#fff7e6", color: "#d46b08" },
    { bg: "#f9f0ff", color: "#531dab" },
    { bg: "#e6fffb", color: "#08979c" },
    { bg: "#fff0f6", color: "#c41d7f" },
    { bg: "#fffbe6", color: "#d48806" },
    { bg: "#fcffe6", color: "#7cb305" },
    { bg: "#f0f5ff", color: "#1d39c4" },
    { bg: "#fff2e8", color: "#d4380d" },
];

function getTagStyle(tagName) {
    const name = String(tagName || "");
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
}

function mapTags(names) {
    if (!Array.isArray(names)) return [];
    return names
        .filter((n) => n)
        .map((name) => {
            const style = getTagStyle(name);
            return { name, bg: style.bg, color: style.color };
        });
}

function buildSections(detail) {
    if (!detail) return [];

    const basic = [];
    pushField(basic, "姓名", detail.name);
    pushField(basic, "归属", detail.affiliation_name);
    pushField(basic, "小名", detail.small_name);
    pushField(basic, "曾用名", detail.former_name);
    pushField(basic, "绰号", detail.sobriquet);
    pushField(basic, "性别", detail.gender_text);
    pushField(basic, "关系", detail.type_text);
    pushField(basic, "民族", detail.nation);
    pushField(basic, "年龄", detail.age_text);
    pushField(basic, "籍贯", detail.native_place);
    pushField(basic, "籍贯地址", detail.native_place_address);
    pushField(basic, "祖籍", detail.ancestral_home);
    pushField(basic, "定居地", detail.settlement);
    pushField(basic, "住址", detail.address, { multiline: true });
    pushField(basic, "兴趣爱好", detail.interests_and_hobbies, { multiline: true });

    const life = [];
    pushField(life, "出生年份", detail.year ? `${detail.year}年` : "");
    pushField(life, "出生日期", detail.date_of_birth);
    pushField(life, "阳历生日", detail.birthday);
    pushField(life, "农历生日", detail.lunar_birthday);
    pushField(life, "星座", detail.constellation_text);
    pushField(life, "生肖", detail.chinese_zodiac);
    pushField(life, "死亡日期", detail.die_day);
    pushField(life, "死亡原因", detail.die_reason);

    const contact = [];
    pushField(contact, "手机", detail.phone, { copyable: true });
    pushField(contact, "微信", detail.wechat, { copyable: true });
    pushField(contact, "QQ", detail.qq, { copyable: true });
    pushField(contact, "邮箱", detail.email);

    const family = [];
    pushField(family, "婚姻", detail.marriage_text);
    pushField(family, "配偶", detail.spouse, { multiline: true });
    pushField(family, "子女", detail.children, { multiline: true });
    pushField(family, "父母", detail.parents, { multiline: true });
    pushField(family, "家庭", detail.family, { multiline: true });

    const work = [];
    pushField(work, "公司", detail.company);
    pushField(work, "部门", detail.department);
    pushField(work, "岗位", detail.job);
    pushField(work, "入职时间", detail.entry_date);
    pushField(work, "工作经历", detail.work_experience, { multiline: true });

    const edu = [];
    pushField(edu, "学校", detail.school);
    pushField(edu, "专业", detail.major);
    pushField(edu, "学历", detail.education);
    pushField(edu, "毕业时间", detail.graduation_date);
    pushField(edu, "班级", detail.class_and_grade);
    pushField(edu, "班内职务", detail.class_post);
    pushField(edu, "教育经历", detail.education_experience, { multiline: true });

    const other = [];
    pushField(other, "认识渠道", detail.channel);
    pushField(other, "认识日期", detail.first_date);
    pushField(other, "个人描述", detail.desc, { multiline: true });
    pushField(other, "备注", detail.remark, { multiline: true });

    return [
        { key: "basic", title: "基本信息", rows: basic },
        { key: "life", title: "生卒信息", rows: life },
        { key: "contact", title: "联系信息", rows: contact },
        { key: "family", title: "家庭信息", rows: family },
        { key: "work", title: "工作信息", rows: work },
        { key: "edu", title: "教育信息", rows: edu },
        { key: "other", title: "其他信息", rows: other },
    ].filter((s) => s.rows.length > 0);
}

Page({
    data: {
        contentHeight: 600,
        id: 0,
        loading: true,
        empty: false,
        detail: null,
        sections: [],
        tags: [],
        photoUrls: [],
        affiliatedPeople: [],
        title: "人事详情",
        canWrite: false,
    },

    onLoad(options) {
        this.setData({ contentHeight: computeContentHeight() });
        const id = Number(options.id || 0);
        if (!id) {
            this.setData({ loading: false, empty: true });
            return;
        }
        this.setData({ id });
        this.loadDetail(id);
    },

    onShow() {
        wx.setNavigationBarColor({
            frontColor: "#000000",
            backgroundColor: "#ffffff",
        });
        if (this._hasShown && this.data.id) {
            this.loadDetail(this.data.id);
        }
        this._hasShown = true;
    },

    onPullDownRefresh() {
        if (!this.data.id) {
            wx.stopPullDownRefresh();
            return;
        }
        this.loadDetail(this.data.id).finally(() => wx.stopPullDownRefresh());
    },

    async loadDetail(id) {
        this.setData({ loading: true });
        try {
            const detail = await MX.get("relation/detail", { id });
            if (!detail || !detail.id) {
                this.setData({
                    loading: false,
                    empty: true,
                    detail: null,
                    sections: [],
                    tags: [],
                    photoUrls: [],
                    affiliatedPeople: [],
                });
                return;
            }
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
                detail,
                sections: buildSections(detail),
                tags: mapTags(detail.tag_names),
                photoUrls: Array.isArray(detail.photo_urls) ? detail.photo_urls : [],
                affiliatedPeople,
                title: detail.name || "人事详情",
                canWrite: (await MX.waitLnnxReady(), MX.canWriteRecord(detail)),
                loading: false,
                empty: false,
                id: detail.id,
            });
        } catch (e) {
            this.setData({
                loading: false,
                empty: true,
                detail: null,
                sections: [],
                tags: [],
                photoUrls: [],
                affiliatedPeople: [],
                canWrite: false,
            });
        }
    },

    handleAffiliated(e) {
        const id = Number(e.currentTarget.dataset.id);
        if (!id || id === this.data.id) return;
        MX.go(`/pages/relation/detail/index?id=${id}`);
    },

    handlePreviewPhoto(e) {
        const { url } = e.currentTarget.dataset;
        if (!url) return;
        wx.previewImage({ current: url, urls: this.data.photoUrls });
    },

    handleCopy(e) {
        const value = e.currentTarget.dataset.value;
        if (!value || value === "-") return;
        wx.setClipboardData({
            data: String(value),
            success() {
                wx.showToast({ title: "已复制", icon: "success" });
            },
        });
    },

    handleEdit() {
        if (!this.data.id || !this.data.canWrite) return;
        MX.go(`/pages/relation/form/index?id=${this.data.id}`);
    },
});
