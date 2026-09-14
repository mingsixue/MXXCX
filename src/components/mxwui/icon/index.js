Component({
    properties: {
        name: { type: String, value: "" },
        color: { type: String, value: "" },
        size: { type: String, value: "48" },
        // 描边宽度，如 6rpx；有值时填充透明，仅显示描边
        stroke: { type: String, value: "" },
    },
});
