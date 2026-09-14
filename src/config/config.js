/**
 * 线上包配置
 * ENV_LIST：开启 ENABLE_DEBUG 后可在小绿点切换；可配置多套测试 / 灰度
 */
const CONFIG = {
    ENV: "production",
    APPID: "wxe992aaf1d44b3595",
    HOST: "https://www.mingsixue.com",
    APIHOST: "https://api.mingsixue.com/lnnx/",
    OSSUPLOADHOST: "",
    OSSHOST: "",
    OSSPREFIX: "upload",
    LOGIN_PAGE: "/packageDemo/login/index",
    WEBVIEW_PAGE: "/packageDemo/webview/index",
    VERSION: "__BUILD_VERSION__",
    ENABLE_DEBUG: false,
    FORCE_UPDATE_URL: "",
    REPORT_URL: "",
    MINI_PROGRAM_APPIDS: [],
    ENV_COOKIE_HEADER: "Cookie",
    ENV_LIST: [
        {
            id: "test-1",
            type: "test",
            name: "测试环境1",
            label: "测试1",
            APIHOST: "https://api-test1.example.com/lnnx/",
            HOST: "https://h5-test1.example.com",
            cookie: "env=test1",
        },
        {
            id: "test-2",
            type: "test",
            name: "测试环境2",
            label: "测试2",
            APIHOST: "https://api-test2.example.com/lnnx/",
            HOST: "https://h5-test2.example.com",
            cookie: "env=test2",
        },
        {
            id: "gray-1",
            type: "gray",
            name: "灰度环境1",
            label: "灰度1",
            APIHOST: "https://api-gray1.example.com/lnnx/",
            HOST: "https://h5-gray1.example.com",
            cookie: "env=gray1",
        },
        {
            id: "gray-2",
            type: "gray",
            name: "灰度环境2",
            label: "灰度2",
            APIHOST: "https://api-gray2.example.com/lnnx/",
            HOST: "https://h5-gray2.example.com",
            cookie: "env=gray2",
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
