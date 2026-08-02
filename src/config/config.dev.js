/**
 * 开发包配置
 * ENV_LIST：可配置多套测试 / 灰度，以及线上；小绿点先选类型再选具体环境
 */
const CONFIG = {
    ENV: "development",
    APPID: "", // 小程序 appId，请填写
    HOST: "", // 未命中 ENV_LIST 时的兜底 H5 域名
    APIHOST: "", // 未命中 ENV_LIST 时的兜底接口域名
    OSSUPLOADHOST: "",
    OSSHOST: "",
    OSSPREFIX: "upload",
    LOGIN_PAGE: "/packageDemo/login/index",
    WEBVIEW_PAGE: "/packageDemo/webview/index",
    VERSION: "__BUILD_VERSION__",
    ENABLE_DEBUG: true,
    FORCE_UPDATE_URL: "",
    REPORT_URL: "",
    MINI_PROGRAM_APPIDS: ['wxd4104f02cafc8d4d'],
    // 小程序限制 Cookie 时可改为 X-Env
    ENV_COOKIE_HEADER: "Cookie",
    ENV_LIST: [
        {
            id: "test-1",
            type: "test",
            name: "测试环境1",
            label: "测试1",
            APIHOST: "https://api-test1.example.com",
            HOST: "https://h5-test1.example.com",
            cookie: "env=test1",
        },
        {
            id: "test-2",
            type: "test",
            name: "测试环境2",
            label: "测试2",
            APIHOST: "https://api-test2.example.com",
            HOST: "https://h5-test2.example.com",
            cookie: "env=test2",
        },
        {
            id: "gray-1",
            type: "gray",
            name: "灰度环境1",
            label: "灰度1",
            APIHOST: "https://api-gray1.example.com",
            HOST: "https://h5-gray1.example.com",
            cookie: "env=gray1",
        },
        {
            id: "gray-2",
            type: "gray",
            name: "灰度环境2",
            label: "灰度2",
            APIHOST: "https://api-gray2.example.com",
            HOST: "https://h5-gray2.example.com",
            cookie: "env=gray2",
        },
        {
            id: "online",
            type: "online",
            name: "线上环境",
            label: "线上",
            APIHOST: "https://api.example.com",
            HOST: "https://h5.example.com",
            cookie: "env=online",
        },
    ],
    HEADER: {
        "content-type": "application/json",
        Cookie: "",
    },
};

export default CONFIG;
