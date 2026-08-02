Page({
    data: {
        name: "",
        remark: "",
        gender: "1",
        hobbies: [],
        enableNotify: true,
        region: ["浙江省", "杭州市", "西湖区"],
        genderOptions: [
            { text: "男", value: "1", checked: true },
            { text: "女", value: "2", checked: false },
        ],
        hobbyOptions: [
            { text: "阅读", value: "read", checked: false },
            { text: "运动", value: "sport", checked: false },
            { text: "音乐", value: "music", checked: false },
        ],
        pickerOptions: [
            { label: "选项A", value: "A" },
            { label: "选项B", value: "B" },
            { label: "选项C", value: "C" },
        ],
        pickerIndex: 0,
    },

    onNameChange(e) {
        this.setData({ name: e.detail.value });
    },

    onRemarkChange(e) {
        this.setData({ remark: e.detail.value });
    },

    onGenderChange(e) {
        const { value, options } = e.detail || {};
        this.setData({
            gender: value,
            genderOptions: options || this.data.genderOptions,
        });
    },

    onHobbyChange(e) {
        const { value, options } = e.detail || {};
        this.setData({
            hobbies: value || [],
            hobbyOptions: options || this.data.hobbyOptions,
        });
    },

    onSwitchChange(e) {
        this.setData({ enableNotify: !!(e.detail && e.detail.value) });
    },

    onPickerChange(e) {
        if (e.detail && e.detail.type === "selector") {
            this.setData({ pickerIndex: Number(e.detail.value) || 0 });
        }
    },

    onRegionChange(e) {
        if (e.detail && e.detail.region) {
            this.setData({ region: e.detail.region });
        }
    },

    handleSubmit() {
        const { pickerOptions, pickerIndex } = this.data;
        const payload = {
            name: this.data.name,
            remark: this.data.remark,
            gender: this.data.gender,
            hobbies: this.data.hobbies,
            enableNotify: this.data.enableNotify,
            picker: (pickerOptions[pickerIndex] && pickerOptions[pickerIndex].label) || "",
            region: this.data.region,
        };
        wx.showModal({
            title: "提交内容",
            content: JSON.stringify(payload),
            showCancel: false,
        });
    },
});
