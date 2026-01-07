"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureSchemaAvailable = ensureSchemaAvailable;
const path = require("path");
const unzipper = require("unzipper");
const https = require("https");
const os = require("os");
const fs = require("fs");
const connection_source_1 = require("./connection-source");
function getBaseDir() {
    const base = path.join(os.homedir(), ".esphome-language-server");
    fs.mkdirSync(base, { recursive: true });
    return base;
}
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, {
            headers: {
                "User-Agent": "esphome-vscode-extension",
                Accept: "application/vnd.github.v3.raw",
            },
        }, (res) => {
            if (res.statusCode === 302 || res.statusCode === 301) {
                const redirectUrl = res.headers.location;
                if (redirectUrl) {
                    return downloadFile(redirectUrl, dest).then(resolve).catch(reject);
                }
                else {
                    return reject(new Error("Redirected but no Location header found"));
                }
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to download file: ${res.statusCode}`));
            }
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on("finish", () => file.close((err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            }));
        });
        request.on("error", reject);
    });
}
function unzip(zipFile, dest) {
    return fs
        .createReadStream(zipFile)
        .pipe(unzipper.Extract({ path: dest }))
        .promise();
}
const tryDownloadSchemaTag = (tag) => __awaiter(void 0, void 0, void 0, function* () {
    const zipPath = path.join(getBaseDir(), tag + ".zip");
    const url = `https://schema.esphome.io/${tag}/schema.zip`;
    console.log(`Downloading ${url} to ${zipPath}`);
    yield downloadFile(url, zipPath);
    const schemaPath = path.join(getBaseDir(), tag);
    yield unzip(zipPath, schemaPath);
    fs.rmSync(zipPath);
    return schemaPath;
});
const retrieveSchema = () => __awaiter(void 0, void 0, void 0, function* () {
    const connected_version = yield (0, connection_source_1.version)();
    let tag = connected_version.endsWith("dev") ? "dev" : connected_version;
    const baseDir = getBaseDir();
    fs.mkdirSync(baseDir, { recursive: true });
    let schemaPath = path.join(baseDir, tag);
    if (fs.existsSync(schemaPath)) {
        if (tag != "dev") {
            console.log(`Using cached schema at ${schemaPath}`);
            return schemaPath;
        }
        // dev schema builds daily, download if file is older than 6 hours
        let esphomeSchemaPath = path.join(schemaPath, "schema", "esphome.json");
        if (fs.existsSync(esphomeSchemaPath)) {
            const stats = fs.statSync(esphomeSchemaPath);
            const modifiedTime = stats.mtime;
            const ageMs = Date.now() - modifiedTime.getTime();
            const TIMEOUT_HOURS = 12;
            if (ageMs > TIMEOUT_HOURS * (60 * 60 * 1000)) {
                console.log(`Cached schema is older than ${TIMEOUT_HOURS} hours (${ageMs / 1000} seconds), need to re-download.`);
            }
            else {
                console.log("Cached dev schema is recent, using it.");
                return schemaPath;
            }
        }
    }
    // Attempt download specific version
    try {
        return yield tryDownloadSchemaTag(tag);
    }
    catch (err) {
        // fallback to dev
        return yield tryDownloadSchemaTag("dev");
    }
});
let schemaAvailablePromise;
function ensureSchemaAvailable() {
    if (!schemaAvailablePromise) {
        schemaAvailablePromise = (() => __awaiter(this, void 0, void 0, function* () {
            return yield retrieveSchema();
        }))();
    }
    return schemaAvailablePromise;
}
//# sourceMappingURL=schema-fetcher.js.map