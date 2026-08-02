/**
 * 小程序代码上传（miniprogram-ci）
 *
 * 环境变量：
 *   WX_CI_APPID          小程序 appid
 *   WX_CI_PRIVATE_KEY    私钥文件绝对路径
 *   WX_CI_VERSION        可选，版本号，默认读 package.json
 *   WX_CI_DESC           可选，备注
 *   WX_CI_PROJECT_PATH   可选，默认 ./dist
 */
import ci from "miniprogram-ci";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

async function main() {
    const appid = process.env.WX_CI_APPID;
    const privateKeyPath = process.env.WX_CI_PRIVATE_KEY;
    const projectPath = path.resolve(process.env.WX_CI_PROJECT_PATH || "./dist");
    const version = process.env.WX_CI_VERSION || pkg.version;
    const desc = process.env.WX_CI_DESC || `upload ${new Date().toISOString()}`;

    if (!appid || !privateKeyPath) {
        console.error(
            "请设置环境变量 WX_CI_APPID 与 WX_CI_PRIVATE_KEY（私钥路径，勿提交仓库）"
        );
        process.exit(1);
    }
    if (!fs.existsSync(privateKeyPath)) {
        console.error("私钥文件不存在:", privateKeyPath);
        process.exit(1);
    }
    if (!fs.existsSync(projectPath)) {
        console.error("项目目录不存在，请先 yarn build:", projectPath);
        process.exit(1);
    }

    const project = new ci.Project({
        appid,
        type: "miniProgram",
        projectPath,
        privateKeyPath,
        ignores: ["node_modules/**/*"],
    });

    const uploadResult = await ci.upload({
        project,
        version,
        desc,
        setting: {
            es6: true,
            minify: true,
        },
        onProgressUpdate: console.log,
    });

    console.log("upload success", uploadResult);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
