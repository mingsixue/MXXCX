/**
 * 开发包配置
 * ENV_LIST：可配置多套测试 / 灰度，以及线上；小绿点先选类型再选具体环境
 */
const CONFIG = {
    ENV: "development",
    APPID: "wxe992aaf1d44b3595", // 小程序 appId，请填写
    HOST: "http://localhost:3000/", // 未命中 ENV_LIST 时的兜底 H5 域名
    APIHOST: "http://localhost:8008/lnnx/", // 未命中 ENV_LIST 时的兜底接口域名
    OSSUPLOADHOST: "",
    OSSHOST: "",
    OSSPREFIX: "upload",
    LOGIN_PAGE: "/packageDemo/login/index",
    WEBVIEW_PAGE: "/packageDemo/webview/index",
    VERSION: "__BUILD_VERSION__",
    ENABLE_DEBUG: true,
    FORCE_UPDATE_URL: "",
    REPORT_URL: "",
    MINI_PROGRAM_APPIDS: [],
    // 小程序限制 Cookie 时可改为 X-Env
    ENV_COOKIE_HEADER: "Cookie",
    ENV_LIST: [
        {
            id: "test-1",
            type: "test",
            name: "测试环境1",
            label: "测试1",
            APIHOST: "http://localhost:8008/lnnx/",
            HOST: "http://localhost:3000/",
            cookie: "env=test1",
        },
        {
            id: "online",
            type: "online",
            name: "线上环境",
            label: "线上",
            APIHOST: "https://api.mingsixue.com/lnnx/",
            HOST: "https://www.mingsixue.com",
            cookie: "env=online",
        },
    ],
    HEADER: {
        "content-type": "application/json",
        Cookie: "",
    },
};

export default CONFIG;
