const fs = require("fs-extra");
const liquid = require("../liquid/index");
const path = require("path");

const formatDate = (date) => {
    var formatedDate = new Date(date);
    var dd = formatedDate.getDate();

    var mm = formatedDate.getMonth() + 1;
    var yyyy = formatedDate.getFullYear();
    if (dd < 10) {
        dd = "0" + dd;
    }

    if (mm < 10) {
        mm = "0" + mm;
    }
    formatedDate = dd + "-" + mm + "-" + yyyy;
    return formatedDate;
};

const cropImage = (img_url, width, height) => {
    return `${img_url}?mode=crop&width=${width}&height=${height}`;
};

const getSettings = function (inputFolderPath) {
    const settings = JSON.parse(
        fs
            .readFileSync(`./${inputFolderPath}/config/settings_data.json`)
            .toString()
    );

    return settings;
};

const getSettingBlock = (blockObject) => {
    let blocks = [];
    if (blockObject)
        blocks = Object.keys(blockObject).map((key) => {
            let currentBlock = blockObject[key];
            const blockType = currentBlock.type;
            if (blockType === "image") {
                if (typeof currentBlock.settings.slide === "string")
                    currentBlock.settings.slide = {
                        img_url: currentBlock.settings.slide,
                        aspect_ratio: 3,
                        alt: "cc",
                    };
            }
            // console.log(currentBlock)
            return {
                id: key,
                ...currentBlock,
            };
        });

    return blocks;
};

const getLiquidFromFile = function (path) {
    if (!fs.existsSync(path)) throw Error(`section ${path} not found!`);
    const liquidString = fs.readFileSync(path).toString();
    const liquidAfterProcess = liquid.preprocessLiquid(liquidString);
    return liquidAfterProcess;
};

const getSection = function (inputFolderPath, sectionName) {
    const pathSection = path.join(
        inputFolderPath,
        `/sections/${sectionName}.liquid`
    );
    return getLiquidFromFile(pathSection);
};

const getTemplate = function (inputFolderPath, templateName) {
    const pathTemplate = path.join(
        inputFolderPath,
        `templates/${templateName}.liquid`
    );
    return getLiquidFromFile(pathTemplate);
};

const getSchemaFromLiquidSection = function (liquidSection) {
    const regexSchemaLiquid = /{%\sschema\s%}[\s\S]*{%\sendschema\s%}/g;
    const regexResults = liquidSection.match(regexSchemaLiquid);
    if (regexResults.length < 0) throw Error("Section dont have schema");

    const schemaLiquid = regexResults[0];

    let indexStart = 0;
    let indexEnd = schemaLiquid.length - 1;

    for (let i = 0; i < schemaLiquid.length; i++) {
        if (schemaLiquid[i] === "%" && schemaLiquid[i + 1] === "}") {
            indexStart = i + 2;
            break;
        }
    }
    for (let i = schemaLiquid.length - 1; i > 0; i--) {
        if (schemaLiquid[i] === "%" && schemaLiquid[i - 1] === "{") {
            indexEnd = i - 2;
            break;
        }
    }

    return JSON.parse(schemaLiquid.substring(indexStart, indexEnd));
};

exports.formatDate = formatDate;
exports.cropImage = cropImage;
exports.getSettings = getSettings;
exports.getSettingBlock = getSettingBlock;
exports.getLiquidFromFile = getLiquidFromFile;
exports.getSection = getSection;
exports.getTemplate = getTemplate;
exports.getSchemaFromLiquidSection = getSchemaFromLiquidSection;
