const path = require("path");
const fs = require("fs");
const _ = require("lodash");
// const { config } = require("../../../config");
const { formatDate, cropImage } = require("../utils/utils");

module.exports = function registCustomTag(engine, inputFolderPath) {
    engine.registerFilter("asset_url", (v) => `/public/${v}`);
    engine.registerFilter("t", async (content, ...args) => {
        let parseObject = {};
        if (args.length > 0) {
            args.forEach((arg) => {
                let [attribute, value] = arg;

                parseObject[attribute] = value;
            });
        }
        const localeJSON = fs
            .readFileSync(
                path.join(
                    __dirname,
                    `/../${inputFolderPath}/locales/en.default.json`
                )
            )
            .toString();
        const locale = JSON.parse(localeJSON);
        const result = _.get(locale, content);
        const renderedResult = await engine.parseAndRender(result, parseObject);
        // if (content === "general.search.results_count_html")
        return renderedResult;
    });
    engine.registerFilter("font_face", (content) => {
        return "";
    });
    engine.registerFilter("times", (content, args) => {
        return content * args;
    });
    engine.registerFilter("divided_by", (content, args) => {
        return content / args;
    });
    engine.registerFilter("stylesheet_tag", (content, args) => {
        return `<link href="${content}" rel="stylesheet" type="text/css" media="all" />`;
    });
    engine.registerFilter("script_tag", (content, args) => {
        return `<script src="${content}"></script>`;
    });
    engine.registerFilter("img_url", (content, args) => {
        return _.get(content, "img_url") ? _.get(content, "img_url") : content;
        let width, height;
        if (args) {
            [width, height] = args.split("x");
            if (width === "1" && height === "1") {
                width = 600;
                height = 600;
            }
        }
        if (_.get(content, "img_url")) {
            if (width || height)
                return cropImage(content.img_url, width, height);
            return content.img_url;
        }
        return content;
    });
    engine.registerFilter("placeholder_svg_tag", (content, args) => {
        // return content
        return `<img src="https://elportaldelchacinado.com/wp-content/plugins/accelerated-mobile-pages/images/SD-default-image.png" alt="default-img" />`;
    });
    engine.registerFilter("truncatewords", (content, args) => {
        if (!content) return null;
        if (content.length < args - 1) return content;
        return content.substring(0, args - 1) + "...";
    });
    engine.registerFilter("link_to_tag", (content, args) => {
        return `<a href="/tags/${content}">${content}</a>`;
    });
    engine.registerFilter("time_tag", (content, args) => {
        return `${formatDate(content)}`;
    });
    engine.registerFilter("money", (content, args) => {
        return `${content}đ`;
    });
};
