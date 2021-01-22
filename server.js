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
const api = require("./utils/api");

const port = 5002;
const app = express();

if (process.argv.length < 3) {
    return console.log("Pls tell me the path to build folder you want to run");
}
const inputFolderPath = process.argv[2];

let globalObject;
console.log("getting global object");
utils.getGlobalObject(inputFolderPath).then((value) => {
    globalObject = value;
    console.log("init done!");
});

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
    const html = await utils.getPage(
        engine,
        inputFolderPath,
        "index",
        {},
        globalObject
    );
    res.send(html);
});

app.get("/products/:productId", async (req, res) => {
    const productId = req.params.productId;
    const product = await api.getProductParseDataById(productId);
    const html = await utils.getPage(
        engine,
        inputFolderPath,
        "product",
        product,
        globalObject
    );
    res.send(html);
});

app.get("/cart", async (req, res) => {
    const html = await utils.getPage(
        engine,
        inputFolderPath,
        "cart",
        {},
        globalObject
    );
    res.send(html);
});

app.get("/search", async (req, res) => {
    const terms = req.query.q;
    const searchData = await api.getSearchData(terms);
    const html = await utils.getPage(
        engine,
        inputFolderPath,
        "search",
        searchData,
        globalObject
    );
    res.send(html);
});

app.get("/collections/:id", async (req, res) => {
    const id = req.params.id;

    const products = await api.getProductsByCollectionId(id);

    const html = await utils.getPage(
        engine,
        inputFolderPath,
        "collection",
        products,
        globalObject
    );
    res.send(html);
});

app.get("/blogs/:id", async (req, res) => {
    const blogCatetegoryId = req.params.id;

    const articles = await api.getArticlesByBlogId(blogCatetegoryId);

    const html = await utils.getPage(
        engine,
        inputFolderPath,
        "blog",
        articles,
        globalObject
    );
    res.send(html);
});

app.get("/blogs/:cateId/:articleId", async (req, res) => {
    const articleId = req.params.articleId;
    const cateId = req.params.cateId;

    const article = await api.getArticleById(articleId, cateId);

    const html = await utils.getPage(
        engine,
        inputFolderPath,
        "article",
        article,
        globalObject
    );
    res.send(html);
});

app.listen(port, () => {
    console.log(`test liquid server is listening on port ${port}`);
});
