# MXXCX 框架

基于微信小程序原生语法的一套开发框架。集成 MXWUI 组件库，内置请求、存储、上传、授权、导航、支付等基建能力，并提供页面模版与 Debug 小绿点。

## 安装与脚本

```bash
yarn

# 开发
yarn start

# 测试/灰度
yarn start:staging
yarn build:staging

# 生产构建
yarn build

# 代码规范
yarn lint
yarn format

# 上传体验版（需配置私钥）
yarn upload
```

用微信开发者工具打开对应输出目录：`dist_dev` / `dist_staging` / `dist`。

**小程序 npm**：依赖写在工程根目录 `package.json` 的 `dependencies`（如 `lottie-miniprogram`）。`yarn start` / `yarn build` 会自动把包同步到产物目录的 `node_modules` 与 `miniprogram_npm`，一般无需再点「构建 npm」。若仍要构建，请在打开的产物目录内操作（已配置 `packNpmManually`）。

## 配置文件

| 环境      | 业务配置                       | 工程配置              |
| --------- | ------------------------------ | --------------------- |
| 开发      | `src/config/config.dev.js`     | `dev.config.json`     |
| 测试/灰度 | `src/config/config.staging.js` | `staging.config.json` |
| 生产      | `src/config/config.js`         | `online.config.json`  |

构建时自动注入 `VERSION`（`package.json version` + 时间戳），如 `1.0.0.202608011430`。

请填写：`APPID`、OSS 等字段；后端多环境（测试/灰度/线上）的域名与 Cookie 在对应 `config.*.js` 的 `ENV_LIST` 中配置。

## UI 组件库

MXWUI 位于 `src/components/mxwui`。**页面中使用组件时优先使用 mxwui。**

所有页面使用自定义导航：`navigationStyle: custom` + `<mx-nav theme="light" title="标题" />`（默认吸顶固定，组件内带占位；已在 `app.json` 全局注册 `mx-nav`）。

```json
{
    "usingComponents": {
        "mx-btn": "/components/mxwui/btn/index",
        "mx-list-basic": "/components/mxwui/list-basic/index"
    }
}
```

## 目录结构

```text
src/
  app.js / app.json
  config/                 # 多环境配置
  utils/                  # 基础函数与模块
  components/
    mxwui/                # UI 组件库
    debug-panel/          # 小绿点 Debug
  pages/index/            # 框架首页
  packageDemo/            # 页面模版与能力示例（分包）
  common/                 # 全局 less 变量
```

路径别名：`@utils`、`@components`、`@config`、`@common`、`@modules`。

## 基础功能

- 版本强制更新（`FORCE_UPDATE_URL`）
- 跳转 H5 / webview、小程序与 H5 交互
- 刘海屏兼容（`system.getSafeArea` + `mx-safe-area`）
- 分包示例、跳转第三方小程序、支付 / Lottie / 订阅消息示例
- 页面模版：首页、个人中心、列表、表单、商品详情、授权等
- gulp 打包压缩、ESLint、Prettier、miniprogram-ci 自动上传
- 版本号自动生成

## 页面模版（packageDemo）

授权、列表、表单、设置、登录（code 流程）、结果页、骨架屏、弹窗/协议弹窗、商品详情、webview、支付、订阅、Lottie、导航示例等。从首页入口进入。

## 基础函数（`@utils` / `MX`）

授权、导航（处理 8 层栈）、时间/数字/字符串/校验、store、系统信息、query 处理、防抖节流、request（去重/取消/登录拦截）、upload（图/视频/文件）、pay、subscribe、lottie、md5、base64、错误上报。

```js
import MX from "@utils/index";

MX.go("/packageDemo/list/index");
MX.formatDate(Date.now(), "yyyy-MM-dd");
MX.post("/api/demo", { id: 1 });
```

## 小绿点 Debug

`ENABLE_DEBUG=true` 时全局开启（`app.json` 已注册，各页面挂载 `<debug-panel />`），所有页面可见。支持路径复制、跳转、清缓存、请求/缓存记录、扫一扫、关闭等。

**后端环境切换**：在 `config.*.js` 的 `ENV_LIST` 按 `type`（`test` / `gray` / `online`）配置，同一类型可写多套（不同 `APIHOST` + `cookie`）。小绿点主面板先点类型，再选具体环境；请求自动带上对应域名与 Cookie。

## 上传

1. 在微信公众平台下载代码上传密钥，放到本地（勿提交仓库）
2. 设置环境变量：`WX_CI_PRIVATE_KEY=/path/to/private.key`、`WX_CI_APPID=wx...`
3. 执行 `yarn build && yarn upload`
