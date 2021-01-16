const ElasticClient = require("./utils/es");
const config = require("./utils/config");
const { Liquid } = require("liquidjs");
const { registCustomFilter, registCustomTag } = require("./liquid/index");
const utils = require('./utils/utils')
const fs = require("fs-extra")
const path = require('path')

const build = async (inputFolderPath) => {
    console.log("built with " + inputFolderPath);

    // init engine 
    const engine = new Liquid({
        extname: ".liquid",
        root: [
            `./${inputFolderPath}/layout`,
            `./${inputFolderPath}/sections`,
            `./${inputFolderPath}/snippets`,
            `./${inputFolderPath}/templates`,
        ],
    });
    registCustomTag(engine, inputFolderPath);
    registCustomFilter(engine, inputFolderPath);

    
    // get all pages
    const allPages = []
    fs.readdirSync(inputFolderPath + '/templates').forEach(fname => {
        const splitNameArr = fname.split(".")
        if (splitNameArr[splitNameArr.length - 1] === "liquid") {
            splitNameArr.splice(splitNameArr.length - 1, 1)
            allPages.push(splitNameArr.join("."))
        }
    })

    // get raw liquid of 1 page
    const raw = utils.getSection(inputFolderPath, 'blog')
    // console.log(raw)
    // console.log(utils.getSchemaFromLiquidSection(raw))

    utils.getContentForIndex(inputFolderPath, engine, {})
};

if (process.argv.length < 3) {
    return console.log(
        "Pls tell me the path to shopify folder you want to build"
    );
}
const inputFolderPath = process.argv[2];

build(inputFolderPath);
