const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { Liquid } = require("liquidjs");
const {
    registCustomFilter,
    registCustomTag,
    preprocessLiquid,
} = require("../liquid/index");
const utils = require("../utils/utils");

const port = 5000;
const app = express();

const inputFolderPath = "build/narrative";
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

let globalObject;
console.log("getting global object");
utils.getGlobalObject(inputFolderPath).then((value) => {
    globalObject = value;
    console.log("init done!");
});

app.use("/public", express.static(path.join(__dirname, "public")));

app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/test", async (req, res) => {
    const html = await utils.getPage(engine, inputFolderPath, "index");
    res.send(html);
});

app.post("/api/render", async (req, res) => {
    console.log(req.body);
    const { liquid, param } = req.body;

    const pLiquid = preprocessLiquid(liquid);

    // const globalObject = await utils.getGlobalObject(inputFolderPath);
    const parseData = {
        ...param,
        ...globalObject,
    };

    const renderLiquid = await engine.parseAndRender(pLiquid, parseData);

    // const renderLiquid = preprocessLiquid(liquid)
    // const html = await utils.getPage(engine, inputFolderPath, "index");

    res.json({
        renderLiquid: renderLiquid,
    });
});

app.listen(port, () => {
    console.log(`test liquid server is listening on port ${port}`);
});
