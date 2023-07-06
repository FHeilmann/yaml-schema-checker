const core = require("@actions/core");

const FileUtils = require("./utils/file-utils");
const StringUtils = require("./utils/string-utils");
const SchemaUtils = require("./utils/schema-utils");
const ActionUtils = require("./utils/action-utils");
const ArrayUtils = require("./utils/array-utils");

async function run() {

    try {

        if (FileUtils.isWorkspaceEmpty()) {
            throw new Error("Workspace is empty. Did you forget to run \"actions/checkout\" before running this Github Action?");
        }

        const inputJsonSchemaFile = ActionUtils.getInput("jsonSchemaFile", { required: true });
        const inputYamlFiles = ActionUtils.getInputAsArray("yamlFiles", { required: true });
        const inputFilesSeparator = ActionUtils.getInput("filesSeparator", { required: false });
        const enableGithubStepSummary = ActionUtils.getInput("enableGithubStepSummary", {required: false });
        const stripContentFromPath = ActionUtils.getInput("stripContentFromPath", {required: false });

        if (StringUtils.isBlank(inputJsonSchemaFile)) {
            throw new Error("The 'jsonSchemaFile' parameter should not be blank");
        }

        if (!FileUtils.exists(inputJsonSchemaFile)) {
            throw new Error(`${inputJsonSchemaFile} could not be found in workspace`);
        }

        if (StringUtils.isBlank(inputYamlFiles)) {
            throw new Error("The 'yamlFiles' parameter should not be blank");
        }

        const yamlFiles = ArrayUtils.split(inputYamlFiles, inputFilesSeparator);

        const schemaContentAsJson = FileUtils.getContentFromJson(inputJsonSchemaFile);

        const files = FileUtils.loadFiles(yamlFiles);

        core.info(`Found ${files.size} file(s). Checking them:`);

        let validFiles = [];
        let invalidFiles = [];
        let stepSummaryTable = [];

        stepSummaryTable.push([{data: "File", header: true}, {data: "Result", header: true}, {data: "Details", header: true}]);

        files.forEach(file => {
            var summary_file_info = {};
            core.debug(`Processing: ${file}`);

            const yamlContentAsJson = FileUtils.getContentFromYaml(file);

            const result = SchemaUtils.validate(schemaContentAsJson, yamlContentAsJson);

            if (stripContentFromPath == "") {
                summary_file_info["file"] = `${file}`;
            } else {
                summary_file_info["file"] = `${file}`.replace(stripContentFromPath, "");
            }

            if (result.errors.length === 0) {
                summary_file_info["result"] = "✅";
                summary_file_info["errors"] = "<ul><li>Validation success!</li></ul>";

                core.info(`✅ ${summary_file_info["file"]}`);
                validFiles.push(file);
            } else {
                summary_file_info["result"] = "❌";
                core.info(`❌ ${summary_file_info["file"]}`);

                invalidFiles.push(file);
                summary_file_info["errors"] = "<ul>";
                result.errors.forEach(error => {
                    summary_file_info["errors"] += `<li>${error.stack}</li>`;
                    core.info(`    - ${error.stack}`);
                });
                summary_file_info["errors"] += "</ul>";
            }
            stepSummaryTable.push([summary_file_info["file"], summary_file_info["result"], summary_file_info["errors"]]);
        });

        if (enableGithubStepSummary == "true") {
            core.summary.addHeading("YAML Validation Results").addTable(stepSummaryTable).write();
        }


        core.info("Done. All files checked");

        core.setOutput("validFiles", validFiles.join(","));
        core.setOutput("invalidFiles", invalidFiles.join(","));

        if (invalidFiles.length !== 0) {
            throw new Error(`It was found ${invalidFiles.length} invalid file(s)`);
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
