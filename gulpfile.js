import pkg from "gulp";
const { src, dest, series, parallel, watch } = pkg;
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { execa } from "execa";
import { deleteAsync } from "del";
import through2 from "through2";
import alias from "gulp-wechat-weapp-src-alisa";
import autoprefixer from "gulp-autoprefixer";
import babel from "gulp-babel";
import base64 from "gulp-base64";
import changed from "gulp-changed";
import gulpIf from "gulp-if";
import jsonminify from "gulp-jsonminify";
import less from "gulp-less";
import notifier from "gulp-notify";
import plumber from "gulp-plumber";
import rename from "gulp-rename";
import sourcemaps from "gulp-sourcemaps";
import cleancss from "gulp-clean-css";
import uglify from "gulp-uglify";
import replace from "gulp-replace";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkgJson = require("./package.json");

const NODE_ENV = process.env.NODE_ENV || "dev";
const isProduction = NODE_ENV === "production";
const isStaging = NODE_ENV === "staging";

const DIST = isProduction ? "./dist" : isStaging ? "./dist_staging" : "./dist_dev";

const wechatToolPath = "/Applications/wechatwebdevtools.app";
const wxcli = `${wechatToolPath}/Contents/MacOS/cli`;

function getBuildVersion() {
    const now = new Date();
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
        now.getDate()
    )}${pad(now.getHours())}${pad(now.getMinutes())}`;
    return `${pkgJson.version || "1.0.0"}.${stamp}`;
}

const BUILD_VERSION = getBuildVersion();

/** 需要打进小程序的 npm 依赖（写在 package.json dependencies） */
function getMiniprogramNpmPackages() {
    return Object.keys(pkgJson.dependencies || {});
}

function resolveConfigPath() {
    if (isProduction) return "src/config/config.js";
    if (isStaging) return "src/config/config.staging.js";
    return "src/config/config.dev.js";
}

function resolveProjectJsonPath() {
    if (isProduction) {
        return fs.existsSync("online.config.json") ? "online.config.json" : "project.config.json";
    }
    if (isStaging) {
        return fs.existsSync("staging.config.json") ? "staging.config.json" : "dev.config.json";
    }
    return fs.existsSync("dev.config.json") ? "dev.config.json" : "project.config.dev.json";
}

const filePath = {
    jsPath: ["src/**/*.js", "!src/config/*.js"],
    wxmlPath: ["src/**/*.xml", "src/**/*.wxml"],
    cssPath: ["src/**/*.less", "src/**/*.wxss"],
    jsonPath: ["src/**/*.json"],
    wxsPath: ["src/**/*.wxs"],
    configPath: resolveConfigPath(),
    projectJsonPath: resolveProjectJsonPath(),
};

function onError(err) {
    notifier.onError({
        title: "Gulp",
        subtitle: "Failure!",
        message: "Error: <%= error.message %>",
        timeout: 5,
        sound: "Beep",
    })(err);
}

function _join(dirname) {
    return path.join(process.cwd(), "src", dirname);
}

const aliasConfig = {
    "@config": _join("config"),
    "@utils": _join("utils"),
    "@components": _join("components"),
    "@modules": _join("modules"),
    "@common": _join("common"),
};

const miniWxml = function () {
    return through2.obj((file, enc, next) => {
        if (file.isNull()) {
            next(null, file);
            return;
        }
        const context = file.contents
            .toString()
            .replace(/\n\s*/gm, " ")
            .replace(/>\s+</g, "><")
            .replace(/<\/([-a-zA-Z]+)\s+>/g, "</$1>")
            .replace(/<!--(.*?)-->/g, "");
        file.contents = Buffer.from(context);
        next(null, file);
    });
};

function wxml() {
    return src(filePath.wxmlPath, { allowEmpty: true })
        .pipe(plumber(onError))
        .pipe(miniWxml())
        .pipe(changed(DIST, { extension: ".wxml" }))
        .pipe(rename({ extname: ".wxml" }))
        .pipe(dest(DIST));
}

function wxss() {
    return src(filePath.cssPath, { base: "src/", allowEmpty: true })
        .pipe(plumber(onError))
        .pipe(changed(DIST, { extension: ".wxss" }))
        .pipe(
            alias({
                "@common": aliasConfig["@common"],
            })
        )
        .pipe(
            base64({
                extensions: ["svg", "png", "jpg"],
                maxImageSize: 1024 * 1024 * 1024 * 1024,
                exclude: [/^(http|https)/],
            })
        )
        .pipe(less())
        .pipe(autoprefixer())
        .pipe(cleancss({ compatibility: "ie9" }))
        .pipe(rename({ extname: ".wxss" }))
        .pipe(dest(DIST));
}

function config() {
    // eslint-disable-next-line no-console
    console.log(
        chalk.cyan(`[config] env=${NODE_ENV} version=${BUILD_VERSION} -> ${filePath.configPath}`)
    );
    return src(filePath.configPath, { base: "src/", allowEmpty: true })
        .pipe(plumber(onError))
        .pipe(replace("__BUILD_VERSION__", BUILD_VERSION))
        .pipe(gulpIf(!isProduction, sourcemaps.init()))
        .pipe(rename({ basename: "config" }))
        .pipe(babel())
        .pipe(dest(DIST));
}

function js() {
    return src(filePath.jsPath, { allowEmpty: true })
        .pipe(
            alias({
                "@utils": aliasConfig["@utils"],
                "@components": aliasConfig["@components"],
            })
        )
        .pipe(plumber(onError))
        .pipe(changed(DIST))
        .pipe(babel())
        .pipe(gulpIf(isProduction, uglify()))
        .pipe(gulpIf(!isProduction, sourcemaps.write()))
        .pipe(dest(DIST));
}

function json() {
    return src(filePath.projectJsonPath, { allowEmpty: true })
        .pipe(plumber(onError))
        .pipe(rename({ basename: "project.config" }))
        .pipe(src(filePath.jsonPath, { allowEmpty: true }))
        .pipe(
            alias({
                "@components": aliasConfig["@components"],
                "@utils": aliasConfig["@utils"],
            })
        )
        .pipe(changed(DIST))
        .pipe(
            gulpIf((file) => {
                return !/project\.config/g.test(String(file.path));
            }, jsonminify())
        )
        .pipe(dest(DIST));
}

function wxs() {
    return src(filePath.wxsPath, { allowEmpty: true })
        .pipe(plumber(onError))
        .pipe(changed(DIST))
        .pipe(babel())
        .pipe(rename({ extname: ".wxs" }))
        .pipe(dest(DIST));
}

function clean() {
    return deleteAsync([DIST]);
}

/**
 * 产物目录写入精简 package.json，供开发者工具识别 / 构建 npm
 *（工程根目录的 node_modules 不在 miniprogramRoot 内）
 */
function writeDistPackageJson(cb) {
    const deps = {};
    getMiniprogramNpmPackages().forEach((name) => {
        deps[name] = (pkgJson.dependencies && pkgJson.dependencies[name]) || "*";
    });
    const distPkg = {
        name: `${pkgJson.name || "mxxcx"}-dist`,
        version: pkgJson.version || "1.0.0",
        dependencies: deps,
    };
    const distDir = path.resolve(DIST);
    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, "package.json"), `${JSON.stringify(distPkg, null, 2)}\n`);
    // eslint-disable-next-line no-console
    console.log(
        chalk.cyan(`[npm] write ${DIST}/package.json deps=[${Object.keys(deps).join(", ") || "-"}]`)
    );
    cb();
}

function pipeToPromise(stream) {
    return new Promise((resolve, reject) => {
        stream.on("end", resolve);
        stream.on("finish", resolve);
        stream.on("error", reject);
    });
}

/**
 * 拷贝小程序 npm 包到产物：
 * 1) node_modules/<pkg> —— 便于开发者工具「构建 npm」
 * 2) miniprogram_npm/<pkg> —— 直接可 require，无需再点构建
 */
async function copyMiniprogramNpm() {
    const names = getMiniprogramNpmPackages();
    for (const name of names) {
        const pkgDir = path.join("node_modules", name);
        const pkgFile = path.join(pkgDir, "package.json");
        if (!fs.existsSync(pkgFile)) {
            // eslint-disable-next-line no-console
            console.log(chalk.yellow(`[npm] skip ${name}（未安装，请先在工程根目录执行 yarn）`));
            continue;
        }
        const meta = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
        const mpDir = meta.miniprogram || "miniprogram_dist";
        const builtDir = path.join(pkgDir, mpDir);

        // eslint-disable-next-line no-console
        console.log(chalk.cyan(`[npm] copy ${name} -> ${DIST}/node_modules`));
        await pipeToPromise(
            src([`${pkgDir}/**/*`, `!${pkgDir}/node_modules/**`], {
                allowEmpty: true,
                base: "node_modules",
            }).pipe(dest(`${DIST}/node_modules`))
        );

        if (fs.existsSync(builtDir)) {
            // eslint-disable-next-line no-console
            console.log(chalk.cyan(`[npm] copy ${name}/${mpDir} -> miniprogram_npm`));
            await pipeToPromise(
                src(`${builtDir}/**/*`, { allowEmpty: true }).pipe(
                    dest(`${DIST}/miniprogram_npm/${name}`)
                )
            );
        } else {
            // eslint-disable-next-line no-console
            console.log(chalk.yellow(`[npm] ${name} 无 ${mpDir}，请在开发者工具中构建 npm`));
        }
    }
}

function openTool() {
    return execa(wxcli, ["-o", path.resolve(DIST)], {
        stdio: "inherit",
    });
}

/** src 相对路径 → 产物路径（含扩展名映射） */
function toDistPath(srcFilePath) {
    const absSrcRoot = path.resolve("src");
    const absFile = path.resolve(srcFilePath);
    let rel = path.relative(absSrcRoot, absFile);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
        // 兜底：相对路径形如 src/xxx
        rel = String(srcFilePath).replace(/^src[\\/]/, "");
    }
    const ext = path.extname(rel).toLowerCase();
    if (ext === ".less") {
        rel = rel.slice(0, -5) + ".wxss";
    } else if (ext === ".xml") {
        rel = rel.slice(0, -4) + ".wxml";
    }
    return path.join(DIST, rel);
}

function safeWatch(globs, opts, task) {
    let watcherInst;
    if (typeof opts === "function") {
        watcherInst = watch(globs, opts);
    } else if (typeof task === "function") {
        watcherInst = watch(globs, opts, task);
    } else {
        watcherInst = watch(globs, opts || {});
    }
    watcherInst.on("error", (err) => {
        // eslint-disable-next-line no-console
        console.log(chalk.red(`[watch] ${err && err.message ? err.message : err}`));
    });
    return watcherInst;
}

async function removeDistTarget(srcFilePath, isDir) {
    const target = toDistPath(srcFilePath);
    // eslint-disable-next-line no-console
    console.log(chalk.yellow(`${isDir ? "删除文件夹" : "删除文件"}：${srcFilePath} → ${target}`));
    try {
        await deleteAsync([target], { force: true });
    } catch (err) {
        // eslint-disable-next-line no-console
        console.log(
            chalk.red(`[watch] 同步删除失败（已忽略）：${err && err.message ? err.message : err}`)
        );
    }
}

function watcher(callback) {
    const addOrChange = { events: ["add", "change"] };
    safeWatch(filePath.wxmlPath, addOrChange, wxml);
    safeWatch(filePath.cssPath, addOrChange, wxss);
    safeWatch(filePath.jsPath, addOrChange, js);
    safeWatch(filePath.jsonPath, addOrChange, json);
    safeWatch(filePath.wxsPath, addOrChange, wxs);
    safeWatch("src/config/*.js", addOrChange, config);

    const deleteWatcher = safeWatch("src/**/*", {
        events: ["unlink", "unlinkDir"],
        ignoreInitial: true,
    });

    deleteWatcher.on("unlink", (filePathStr) => {
        removeDistTarget(filePathStr, false);
    });
    deleteWatcher.on("unlinkDir", (filePathStr) => {
        removeDistTarget(filePathStr, true);
    });

    const projectConfigJson = `${DIST}/project.config.json`;

    safeWatch(projectConfigJson, function syncProjectConfig() {
        const projectConfig = isProduction
            ? "online.config"
            : isStaging
              ? "staging.config"
              : "dev.config";
        return src(projectConfigJson, { allowEmpty: true })
            .pipe(plumber(onError))
            .pipe(
                rename({
                    basename: projectConfig,
                })
            )
            .pipe(dest("./"));
    });

    callback();
}

const buildTasks = series(
    writeDistPackageJson,
    parallel(config, js, json, wxml, wxss, wxs, copyMiniprogramNpm)
);

const watchs = series(buildTasks, watcher);
export { watchs as watch, openTool };

const defaultTask = series(clean, buildTasks);
export default defaultTask;
