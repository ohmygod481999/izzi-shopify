const fs = require("fs-extra");
const liquid = require("../liquid/index");
const path = require("path");
const ElasticClient = require("./es");
const dummyData = require("../dummy-data");
const config = require("./config");
const url = require("url");
const https = require("https");
const sizeOf = require("image-size");
const sass = require("node-sass");

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

const getContentForIndex = async (inputFolderPath, engine, parseData) => {
    const settings = getSettings(inputFolderPath);
    const content_for_index = settings.current.content_for_index;
    const sections = content_for_index.map((idSection) => ({
        id: idSection,
        sectionSettings: settings.current.sections[idSection],
    }));
    const sectionsLiquid = [];
    for (let section of sections) {
        const { id, sectionSettings } = section;
        const { type } = sectionSettings;
        let liquidSection = getSection(inputFolderPath, type);

        // Schema in the liquid Section
        // const schema = getSchemaFromLiquidSection(liquidSection);

        // Setting of the section in settings_data.json
        const blocks = getSettingBlock(sectionSettings.blocks);

        const parseDataToSection = {
            section: {
                id: id,
                ...sectionSettings,
                settings: sectionSettings.settings,
                blocks: blocks,
            },
            settings: settings.current,
            ...parseData,
        };

        // get data by section type
        switch (type) {
            case "featured-products":
                // const idCollection = sectionSettings.settings.collection;
                // const products = await eInstance.getProductsByCategory(
                //     idCollection
                // );
                // const category = await eInstance.getCategoryById(idCollection);

                // parseDataToSection.collections = {
                //     [idCollection]: {
                //         title: category.name,
                //         images: category.images.map((img) => ({
                //             img_url: config.imageRoot + img.path,
                //         })),
                //         image: {
                //             img_url:
                //                 category.images.length > 0
                //                     ? config.imageRoot + category.images[0].path
                //                     : config.imageDefault,
                //         },
                //         url: `/collections/${category.id}`,
                //         products: products.map((product) => ({
                //             title: product.name,
                //             images: product.images.map((img) => ({
                //                 img_url: config.imageRoot + img.path,
                //             })),
                //             featured_image: {
                //                 img_url: _.get(product, "images[0].path")
                //                     ? config.imageRoot +
                //                       _.get(product, "images[0].path")
                //                     : null,
                //                 aspect_ratio: 1.0,
                //             },
                //             url: `/products/${product.id}`,
                //         })),
                //     },
                // };
                break;

            default:
                break;
        }

        // for (let block of blocks){
        //     console.log(type)
        //     if (block.type === "collection") {
        //         console.log(block)
        //     }
        // }

        liquidSection = `<div class="shopify-section index-section">${liquidSection}</div>`;

        const preprocessedLiquidSection = liquid.preprocessLiquid(
            liquidSection
        );

        const renderedSection = await engine.parseAndRender(
            preprocessedLiquidSection,
            parseDataToSection
        );

        sectionsLiquid.push(renderedSection);
    }
    const content_for_index_homepage = sectionsLiquid.join("\n");
    return content_for_index_homepage;
};

const getImageSize = (img_url) => {
    var options = url.parse(img_url);

    return new Promise((resolve, reject) => {
        https.get(options, function (response) {
            var chunks = [];
            response
                .on("data", function (chunk) {
                    chunks.push(chunk);
                })
                .on("error", function (err) {
                    reject(err);
                })
                .on("end", function () {
                    var buffer = Buffer.concat(chunks);
                    // console.log(sizeOf(buffer));
                    resolve(sizeOf(buffer));
                });
        });
    });
};

const getImageObject = async (image) => {
    const img_url = config.imageRoot + image.path;
    const imgSize = await getImageSize(img_url);
    const { width, height, type } = imgSize;

    return {
        img_url: img_url,
        width: width,
        height: height,
        aspect_ratio: width / height,
    };
};

const getImagesObject = async (images) => {
    const imageObjects = [];
    for (const image of images) {
        const temp = await getImageObject(image);
        imageObjects.push(temp);
    }
    //  images.map((image) => getImageObject(image));
    const featured_image = imageObjects.length > 0 ? imageObjects[0] : null;
    return {
        images: imageObjects,
        featured_image: featured_image,
        featured_media: featured_image,
        image: featured_image,
    };
};

const getGlobalObject = async (inputFolderPath) => {
    const eInstance = new ElasticClient(config.merchantId);
    const allCollections = await eInstance.getCategoriesByType(
        config.categortType.PRODUCT
    );
    const allCollectionsMap = {};
    for (const collection of allCollections) {
        const imagesObject = await getImagesObject(collection.images);
        allCollectionsMap[collection.id] = {
            title: collection.name, //collection
            ...imagesObject,
            url: `/collections/${collection.id}`,
        };
    }

    for (let collection of allCollections) {
        const products = await eInstance.getProductsByCategory(collection.id);

        const resultProducts = [];
        for (const product of products) {
            const imagesObject = await getImagesObject(product.images);
            resultProducts.push({
                title: product.name,
                ...imagesObject,
                url: `/products/${product.id}`,
            });
        }
        allCollectionsMap[collection.id].products = resultProducts;
    }

    /**
     * @description: Get Articles
     */
    const allBlogs = await eInstance.getCategoriesByType(
        config.categortType.ARTICLE
    );
    const allBlogsMap = {};
    for (const blog of allBlogs) {
        const imagesObject = await getImagesObject(blog.images);
        allBlogsMap[blog.id] = {
            title: blog.name, //blog
            ...imagesObject,
            url: `/blogs/${blog.id}`,
        };
    }

    for (let blog of allBlogs) {
        const articles = await eInstance.getArticlesByCategory(blog.id);

        const resultArticles = [];
        for (const article of articles) {
            const imagesObject = await getImagesObject(article.images);
            resultArticles.push({
                title: article.name,
                ...imagesObject,
                url: `/blogs/${blog.id}/${article.id}`,
                published_at: article.createdDate,
            });
        }
        allBlogsMap[blog.id].articles = resultArticles;
    }
    const settings = getSettings(inputFolderPath);

    const dataToParse = {
        settings: settings.current,
        collections: allCollectionsMap,
        blogs: allBlogsMap,
        ...dummyData,
    };
    return dataToParse;
};

const getPage = async (
    engine,
    inputFolderPath,
    templateName,
    inputData,
    globalObject
) => {
    const raw = fs
        .readFileSync(
            path.join(
                __dirname,
                "../",
                inputFolderPath,
                "layout",
                "theme.liquid"
            )
        )
        .toString();

    const templateLiquid = getTemplate(inputFolderPath, templateName);
    if (!globalObject) {
        globalObject = await getGlobalObject(inputFolderPath);
    }

    let parseData = globalObject;
    if (templateName === "index") {
        parseData.content_for_index = await getContentForIndex(
            inputFolderPath,
            engine,
            parseData
        );
    }

    if (inputData) {
        parseData = {
            ...parseData,
            ...inputData,
        };
    }

    const rendered_template = await engine.parseAndRender(
        templateLiquid,
        parseData
    );

    const result = await engine.parseAndRender(raw, {
        ...globalObject,
        content_for_layout: rendered_template,
    });
    return result;
};

const exportSassFromCss = (inputFolderPath) => {
    const scssFilePaths = [];
    fs.readdirSync(path.join(inputFolderPath, "assets")).forEach((fname) => {
        if (path.extname(fname) === ".scss") {
            scssFilePaths.push(fname);
        }
    });

    console.log(scssFilePaths);

    scssFilePaths.forEach((scssFile) => {
        sass.render(
            {
                file: path.join(inputFolderPath, "assets", scssFile),
            },
            function (err, result) {
                if (err) return console.error(err);
                const css = result.css;
                fs.writeFile(
                    path.join(inputFolderPath, "assets", scssFile + ".css"),
                    css,
                    function (err) {
                        if (err) console.error(err);
                    }
                );
            }
        );
    });
};

exports.formatDate = formatDate;
exports.cropImage = cropImage;
exports.getSettings = getSettings;
exports.getSettingBlock = getSettingBlock;
exports.getLiquidFromFile = getLiquidFromFile;
exports.getSection = getSection;
exports.getTemplate = getTemplate;
exports.getSchemaFromLiquidSection = getSchemaFromLiquidSection;
exports.getContentForIndex = getContentForIndex;
exports.getPage = getPage;
exports.getGlobalObject = getGlobalObject;
exports.getImageObject = getImageObject;
exports.getImagesObject = getImagesObject;
exports.exportSassFromCss = exportSassFromCss;
