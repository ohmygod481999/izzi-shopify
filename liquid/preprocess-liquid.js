const _ = require("lodash");
const fs = require("fs");
const path = require("path");

const preprocessLiquid = (liquidString) => {
    // Process {%- liquid -%} tag
    const regexLiquidTag = /{%-\s*liquid[^{%]*-%}/g;

    function getContentTag(tagName, string) {
        let indexStart = 0;
        let indexEnd = 0;

        for (let i = 0; i < string.length; i++) {
            if (
                _.range(i, i + tagName.length)
                    .map((index) => string[index])
                    .join("") === tagName
            ) {
                indexStart = i + tagName.length;
                break;
            }
        }
        for (let i = string.length - 1; i > 0; i--) {
            if (
                string[i] === "}" &&
                string[i - 1] === "%" &&
                string[i - 2] === "-"
            ) {
                indexEnd = i - 3;
                break;
            }
        }

        return string.substring(indexStart, indexEnd);
    }
    function addPrefixAndPostfixEachLine(line) {
        if (line.trim()) return `{% ${line} %}`;
        return "";
    }
    function process(str) {
        const content = getContentTag("liquid", str);
        return content
            .split("\n")
            .map((line) => addPrefixAndPostfixEachLine(line))
            .join("\n");
    }
    const resultProcessLiquid = liquidString.replace(regexLiquidTag, (str) =>
        process(str)
    );

    // Process capture tag
    const regexCaptureTag = /{%-?\s*capture[^{%]*-?%}/g;

    function processCaptureTag(str) {
        return str.replace(/\"/g, "");
    }
    const resultProcessCapture = resultProcessLiquid.replace(
        regexCaptureTag,
        (str) => processCaptureTag(str)
    );

    return resultProcessCapture;
};

exports.preprocessLiquid = preprocessLiquid;
