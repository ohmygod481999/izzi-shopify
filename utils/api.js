const graph = require("./graph");
const fs = require("fs-extra");
const utils = require("./utils");
const ElasticClient = require("./es");
const config = require("./config");

const eInstance = new ElasticClient(config.merchantId);

const getProductParseDataById = async (productId) => {
    const productGraph = await graph.queryGraph(
        "single",
        "product",
        {
            id: productId, //bc99bc81-d4ab-010c-5e12-b02633c2dda0
        },
        [
            "id",
            "name",
            "price",
            "description",
            "images {id, name, path}",
            "subDescription",
        ]
    );
    const { product } = productGraph;
    console.log(product);

    // build data
    const dataToParse = {
        product: {
            title: product.name,
            description: product.description,
            vendor: "vendor",
            price: product.price,
        },
    };

    const imagesObject = await utils.getImagesObject(product.images);

    dataToParse.product = {
        ...dataToParse.product,
        ...imagesObject,
    };

    dataToParse.product.selected_or_first_available_variant = {
        ...dataToParse.product,
    };

    return dataToParse;
};

const getSearchData = async (terms) => {
    let dataToParse = {};
    if (!terms) return dataToParse;
    const dataGraph = await graph.queryGraph(
        "multiple",
        "products",
        {
            keyword: terms, //bc99bc81-d4ab-010c-5e12-b02633c2dda0
        },
        [
            "id",
            "name",
            "description",
            "images {id, name, path}",
            "subDescription",
        ]
    );

    let { products } = dataGraph;

    products = await Promise.all(
        products.items.map(
            (product) =>
                new Promise((resolve, reject) => {
                    utils
                        .getImagesObject(product.images)
                        .then((imagesObject) => {
                            resolve({
                                title: product.name,
                                content: product.subDescription
                                    ? product.subDescription
                                    : "",
                                url: `/products/${product.id}`,
                                ...imagesObject,
                            });
                        });
                })
        )
    );

    dataToParse.search = {
        performed: true,
        terms: terms,
        results_count: products.totalCount,
        results: products,
    };

    return dataToParse;
};

const getProductsByCollectionId = async (collectionId) => {
    const products = await eInstance.getProductsByCategory(collectionId);

    console.log(products);

    const parentDataGraph = await graph.queryGraph(
        "single",
        "category",
        {
            id: collectionId, //bc99bc81-d4ab-010c-5e12-b02633c2dda0
        },
        [
            "id",
            "name",
            "description",
            "images {id, name, path}",
            "subDescription",
        ]
    );

    const resultProductsPromise = products.map(
        (product) =>
            new Promise((resolve, reject) => {
                utils
                    .getImagesObject(product.images)
                    .then((imagesObject) => {
                        resolve({
                            title: product.name,
                            url: `/products/${product.id}`,
                            ...imagesObject,
                            ...product,
                        });
                    })
                    .catch((err) => reject(err));
            })
    );

    const resultProducts = await Promise.all(resultProductsPromise);

    const dataToParse = {
        collection: {
            title: parentDataGraph.category.name,
            products: resultProducts,
        },
    };

    return dataToParse;
};

const getArticlesByBlogId = async (blogCatetegoryId) => {
    const dataGraph = await graph.queryGraph(
        "multiple",
        "articles",
        {
            categoryId: blogCatetegoryId, //bc99bc81-d4ab-010c-5e12-b02633c2dda0
        },
        [
            "id",
            "name",
            "description",
            "images {id, name, path}",
            "subDescription",
            "createdDate",
        ]
    );
    const articles = [];
    for (const article of dataGraph.articles.items) {
        const imagesObject = await utils.getImagesObject(article.images);
        articles.push({
            url: `/blogs/${blogCatetegoryId}/${article.id}`,
            title: article.name,
            content: article.subDescription,
            published_at: article.createdDate,
            ...imagesObject,
            ...article,
        });
    }

    const blog = await eInstance.getCategoryById(blogCatetegoryId);
    const imagesObjectBlog = await utils.getImagesObject(blog.images);
    const blogModified = {
        ...blog,
        title: blog.name,
        ...imagesObjectBlog,
        articles: articles,
        all_tags: ["tag1", "tag2", "tag3"],
    };

    const dataToParse = {
        blog: blogModified,
    };

    return dataToParse;
};

const getArticleById = async (articleId, cateId) => {
    const dataGraph = await graph.queryGraph(
        "single",
        "article",
        {
            id: articleId, //bc99bc81-d4ab-010c-5e12-b02633c2dda0
        },
        [
            "id",
            "name",
            "description",
            "images {id, name, path}",
            "subDescription",
            "createdDate",
        ]
    );

    const imagesObject = await utils.getImagesObject(dataGraph.article.images);

    const dataToParse = {
        blog: {
            title: "blog.title",
            url: `/blogs/${cateId}`,
            all_tags: ["tag1", "tag2", "tag3"],
        },
        article: {
            ...dataGraph.article,
            tags: ["tag1", "tag2", "tag3"],
            title: dataGraph.article.name,
            content: dataGraph.article.description,
            published_at: dataGraph.article.createdDate,
            author: "longvb",
            ...imagesObject,
        },
    };

    return dataToParse;
};

exports.getProductParseDataById = getProductParseDataById;
exports.getSearchData = getSearchData;
exports.getProductsByCollectionId = getProductsByCollectionId;
exports.getArticlesByBlogId = getArticlesByBlogId;
exports.getArticleById = getArticleById;
