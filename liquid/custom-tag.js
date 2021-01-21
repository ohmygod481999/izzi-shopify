const path = require("path");
const fs = require("fs");
const { getSettings, getSettingBlock } = require("../utils/utils");
const { preprocessLiquid } = require("./preprocess-liquid");
// const { config } = require("../../../config");

module.exports = function registCustomTag(engine, inputFolderPath) {
    engine.registerTag("section", {
        parse: function (tagToken, remainTokens) {
            this.str = tagToken.args;
        },
        render: async function (context, hash) {
            var str = await this.liquid.evalValue(this.str, context);

            const sectionFolderPath = path.join(
                __dirname,
                `/../${inputFolderPath}/sections/${str}.liquid`
            );

            const raw = fs.readFileSync(sectionFolderPath).toString();

            const sectionData = {
                ...context.environments,
            };
            const setting = getSettings(inputFolderPath);

            if (str === "header" || str === "footer") {
                sectionData.section = {
                    // Thieu section id
                    ...setting.current.sections[str],
                    blocks: getSettingBlock(
                        setting.current.sections[str].blocks
                    ),
                };
            }

            const preprocessedLiquidSection = preprocessLiquid(raw);
            const rendered = engine.parseAndRender(
                preprocessedLiquidSection,
                sectionData
            );
            // console.log(preprocessedLiquidSection)
            return rendered;
        },
    });

    engine.registerTag("render", {
        parse: function (tagToken, remainTokens) {
            const [str, ...args] = tagToken.args.split(",");
            this.str = str;
            this.argsLiquid = "";
            if (args.length > 0) {
                this.argsLiquid = args
                    .map((arg) => `{%- assign ${arg.replace(":", " =")} -%}`)
                    .join("\n");
            }
        },
        render: async function (context, emitter) {
            var str = await this.liquid.evalValue(this.str, context);
            let raw;
            let sectionFolderPath = path.join(
                __dirname,
                `/../${inputFolderPath}/snippets/${str}.liquid`
            );
            if (!fs.existsSync(sectionFolderPath)) {
                sectionFolderPath = path.join(
                    __dirname,
                    `/../${inputFolderPath}/sections/${str}.liquid`
                );
            }
            raw = fs.readFileSync(sectionFolderPath).toString();
            raw = this.argsLiquid + raw;

            const processedLiquid = preprocessLiquid(raw);

            const rendered = engine.parseAndRender(processedLiquid, {
                ...context.environments,
                ...context.scopes[0],
                ...context.scopes[1],
            });
            return rendered;
        },
    });

    engine.registerTag("schema", {
        parse: function (tagToken, remainTokens) {
            this.str = null;

            const stream = this.liquid.parser
                .parseStream(remainTokens)
                .on("start", () => {})
                .on("template", (tpl) => {
                    this.str = tpl.str;
                })
                .on("tag:endschema", () => {
                    stream.stop();
                })
                .on("end", (token) => {
                    throw new Error(`tag ${token.getText()} not closed`);
                });
            stream.start();
        },
        render: async function (scope, emitter) {
            // const schemaSettings = JSON.parse(this.str).settings;
            // const currentSectionId = scope.scopes[0].sectionId;
            // if (currentSectionId) {
            //     const sectionSettings = getSettings();
            //     const currentSectionSeting =
            //         sectionSettings.current.sections[currentSectionId];
            // }
            return "";
        },
    });
    engine.registerTag("style", {
        parse: function (tagToken, remainTokens) {
            this.str = "";

            const stream = this.liquid.parser
                .parseStream(remainTokens)
                .on("token", (token) => {
                    if (token.name === "endstyle") return stream.stop();
                    this.str =
                        this.str +
                        token.input.substring(token.begin, token.end);
                });
            stream.start();
        },
        render: async function (context, hash) {
            const rendered = await engine.parseAndRender(this.str, {
                ...context.environments,
                ...context.scopes[0],
            });
            return `
                <style>
                    ${rendered}
                </style>
            `;
        },
    });

    engine.registerTag("javascript", {
        parse: function (tagToken, remainTokens) {
            this.str = "";

            const stream = this.liquid.parser
                .parseStream(remainTokens)
                .on("token", (token) => {
                    if (token.name === "endjavascript") return stream.stop();
                    this.str =
                        this.str +
                        token.input.substring(token.begin, token.end);
                });
            stream.start();
        },
        render: async function (context, hash) {
            const rendered = await engine.parseAndRender(this.str, {
                ...context.environments,
                ...context.scopes[0],
            });
            return `
                <script>
                    ${rendered}
                </script>
            `;
        },
    });

    engine.registerTag("form", {
        parse: function (tagToken, remainTokens) {
            this.str = "";
            const [formType, ...args] = tagToken.args.split(",");
            // console.log(args);
            this.requiredParam = null;
            this.remainParams = [];
            if (args.length > 0) {
                if (!args[0].includes(":")) {
                    this.requiredParam = args[0].trim();
                    args.forEach((arg, i) => {
                        if (i !== 0) this.remainParams.push(arg);
                    });
                } else {
                    args.forEach((arg) => {
                        this.remainParams.push(arg);
                    });
                }
            }

            // console.log(tagToken.args)
            const stream = this.liquid.parser
                .parseStream(remainTokens)
                .on("token", (token) => {
                    if (token.name === "endform") return stream.stop();
                    this.str =
                        this.str +
                        token.input.substring(token.begin, token.end);
                });
            stream.start();
        },
        render: async function (context, hash) {
            console.log(this.requiredParam);
            if (this.requiredParam) {
                if (this.requiredParam in context.scopes[0]) {
                    this.requiredParam = context.scopes[0][this.requiredParam];
                } else if (this.requiredParam in context.environments) {
                    this.requiredParam =
                        context.environments[this.requiredParam];
                } else {
                    this.requiredParam = {};
                }
            }
            this.remainParams = this.remainParams.map((param) => {
                let [key, value] = param.split(":");
                value = value.trim();
                if (value[0] === '"' || value[0] === "'") {
                    let newValue = "";
                    for (let i = 1; i < value.length - 1; i++) {
                        newValue += value[i];
                    }
                    value = newValue;
                } else {
                    if (value in context.scopes[0]) {
                        value = context.scopes[0][value];
                    } else if (value in context.environments) {
                        value = context.environments[value];
                    } else {
                        value = "";
                    }
                }
                return [key, value];
            });
            console.log(this.requiredParam);
            console.log(this.remainParams);
            let openTag = "<form ";
            this.remainParams.forEach((param) => {
                const [attribute, value] = param;
                openTag += `${attribute}="${value}" `;
            });
            openTag += ">";
            let closeTag = "</form>";
            const rendered = await engine.parseAndRender(this.str, {
                ...context.environments,
                ...context.scopes[0],
            });
            return openTag + "\n" + rendered + "\n" + closeTag;
        },
    });

    engine.registerTag("liquid", {
        parse: function (tagToken, remainTokens) {
            // DO Nothing
        },
    });

    engine.registerTag("paginate", {
        parse: function (tagToken, remainTokens) {
            this.str = "";

            const stream = this.liquid.parser
                .parseStream(remainTokens)
                .on("token", (token) => {
                    if (token.name === "endpaginate") return stream.stop();
                    this.str =
                        this.str +
                        token.input.substring(token.begin, token.end);
                });
            stream.start();
        },
        render: async function (context, hash) {
            const rendered = await engine.parseAndRender(this.str, {
                ...context.environments,
                ...context.scopes[0],
            });
            return rendered;
        },
    });
};
