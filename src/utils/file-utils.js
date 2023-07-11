const fs = require("fs");
const path = require("path");
const process = require("process");
const { glob } = require("glob");
const StringUtils = require("./string-utils");
const core = require("@actions/core");

class FileUtils {

    static isWorkspaceEmpty() {

        return FileUtils.isEmpty(FileUtils.getWorkspacePath());
    }

    static getWorkspacePath() {

        return process.env["GITHUB_WORKSPACE"] || "";
    }

    static exists(fileOrPath) {

        return fs.existsSync(fileOrPath);
    }

    static loadFiles(array, workingDirectory) {

        core.debug("Loading all files");

        const files = new Set();

        array.forEach(el => {

            core.debug(`Processing: ${el}`);

            FileUtils.searchFiles(el, workingDirectory).forEach(file => {

                core.debug(`Adding file: ${file}`);

                files.add(file);
            });
        });

        return files;
    }

    static searchFiles(pattern, workingDirectory) {

        const options = {
            cwd: workingDirectory
        };

        return glob.sync(pattern, options);
    }

    static isEmpty(path) {

        if (!FileUtils.exists(path)) {
            throw new Error(`${path} does not exist`);
        }

        return fs.readdirSync(path).length === 0;
    }

    static getContent(file, encoding = "utf-8") {


        return fs.readFileSync(file, { encoding });
    }

    static getContentFromJson(file, workingDirectory = "", encoding = "utf-8") {
        const fullPath = (workingDirectory === "") ? file : path.join(workingDirectory, file);
        const content = FileUtils.getContent(fullPath, encoding);

        return StringUtils.parseJson(file, content);
    }

    static getContentFromYaml(file, workingDirectory = "", encoding = "utf-8") {
        const fullPath = (workingDirectory === "") ? file : path.join(workingDirectory, file);
        const content = FileUtils.getContent(fullPath, encoding);

        return StringUtils.parseYaml(file, content);
    }
}

module.exports = FileUtils;
