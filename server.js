const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { Liquid } = require("liquidjs");
const {
    registCustomFilter,
    registCustomTag,
    preprocessLiquid,
} = require("./liquid/index");
const utils = require("./utils/utils");

const port = 5001;
const app = express();

if (process.argv.length < 3) {
    return console.log("Pls tell me the path to build folder you want to run")
}
const inputFolderPath = process.argv[2]

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

app.set("view engine", "liquid"); // set liquid to default

app.use("/public", express.static(`${inputFolderPath}/assets`));
// app.use("/public", express.static(path.join(__dirname, "public")));

// app.use(bodyParser.json());

app.get("/", async (req, res) => {
    const html = await utils.getPage(engine, inputFolderPath, "index");
    res.send(html);
});

app.listen(port, () => {
    console.log(`test liquid server is listening on port ${port}`);
});
