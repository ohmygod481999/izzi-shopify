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

    // engine.registerTag("render", {
    //     parse: function (tagToken, remainTokens) {
    //         const [str, ...args] = tagToken.args.split(",");
    //         this.str = str;
    //         this.argsLiquid = "";
    //         if (args.length > 0) {
    //             this.argsLiquid = args
    //                 .map((arg) => `{%- assign ${arg.replace(":", " =")} -%}`)
    //                 .join("\n");
    //         }
    //     },
    //     render: async function (context, emitter) {
    //         var str = await this.liquid.evalValue(this.str, context);
    //         let raw;
    //         let sectionFolderPath = path.join(
    //             __dirname,
    //             `/../${inputFolderPath}/snippets/${str}.liquid`
    //         );
    //         if (!fs.existsSync(sectionFolderPath)) {
    //             sectionFolderPath = path.join(
    //                 __dirname,
    //                 `/../${inputFolderPath}/sections/${str}.liquid`
    //             );
    //         }
    //         raw = fs.readFileSync(sectionFolderPath).toString();
    //         raw = this.argsLiquid + raw;

    //         const processedLiquid = preprocessLiquid(raw);

    //         const rendered = engine.parseAndRender(processedLiquid, {
    //             ...context.environments,
    //             ...context.scopes[0],
    //             ...context.scopes[1],
    //         });
    //         return rendered;
    //     },
    // });

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
            // const [formType] = tagToken.args.split(",")
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
            // console.log(context.environments)
            // console.log("-------------------------------")
            const rendered = await engine.parseAndRender(this.str, {
                ...context.environments,
                ...context.scopes[0],
            });
            return rendered;
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
