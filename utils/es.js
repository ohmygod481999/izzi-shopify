const { Client } = require("@elastic/elasticsearch");

class ElasticClient {
    constructor(merchantId) {
        const auth = {
            username: "amara",
            password: "dSPKMcdQkG5X97b",
        };
        const root = "https://es.foodizzi.com";
        this.eInstance = new Client({
            node: root,
            auth: auth,
        });
        this.merchantId = merchantId;
    }

    search = ({ index, type, body, from, size }) => {
        return this.eInstance.search({
            index: index,
            type: type,
            body: body,
        });
    };

    getCategories = ({ body, from, size }) => {
        return this.search({
            index: "categories",
            type: "category",
            body: body,
            from: from,
            size: size,
        });
    };

    getArticles = async ({ body, from, size }) => {
        return this.search({
            index: "articles",
            type: "article2",
            body: body,
            from: from,
            size: size,
        });
    };

    getProducts = async ({ body, from, size }) => {
        return this.search({
            index: "products",
            type: "product",
            body: body,
            from: from,
            size: size,
        });
    };

    getMerchant = ({ merchantCode = "cokoglobal", from, size = 1 }) => {
        return this.search({
            index: "merchants",
            type: "merchant",
            body: {
                query: {
                    match: {
                        code: {
                            query: merchantCode,
                        },
                    },
                },
                sort: [],
                _source: {},
            },
            from: from,
            size: size,
        });
    };

    getThemeInfo = async ({ merchantCode }) => {
        const merchant = await this.getMerchant({
            merchantCode: merchantCode,
            size: 1,
        });

        const themes = merchant.body.hits.hits[0]._source.themeWebs;

        const featuredTheme = themes.find((theme) => theme.isFeatured);
        return {
            scripts: featuredTheme.script.split(","),
            styles: featuredTheme.css.split(","),
        };
    };

    getSections = async (pageName) => {
        const categories = await this.getCategories({
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    default_field: "merchantId",
                                    query: this.merchantId,
                                },
                            },
                            {
                                match: {
                                    languageId:
                                        "838aef56-78bb-11e6-b5a6-00155d582814",
                                },
                            },
                            {
                                match: {
                                    parentId:
                                        "00000000-0000-0000-0000-000000000000",
                                },
                            },
                            {
                                match: {
                                    "themeWebs.id":
                                        "4e462311-6603-2e19-d1b8-1b0d7d4cf0f7",
                                },
                            },
                            { match_phrase: { name: pageName } },
                        ],
                        must_not: [],
                    },
                },
                sort: [],
                _source: { includes: [] },
            },
            from: 0,
            size: 100,
        });
        if (!categories.body.hits.hits[0]) return [`<p>Empty</p>`];
        const sections = categories.body.hits.hits[0]._source.categories
            .map((category) => category.description)
            .reverse();
        return sections;
    };

    getPageSections = async (
        parentId = "804df8d6-3d48-1435-4738-2fbbc063c965"
    ) => {
        const categories = await this.getCategories({
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    default_field: "merchantId",
                                    query: this.merchantId,
                                },
                            },
                            {
                                match: {
                                    languageId:
                                        "838aef56-78bb-11e6-b5a6-00155d582814",
                                },
                            },
                            {
                                match: {
                                    parentId: parentId,
                                },
                            },
                        ],
                        must_not: [],
                    },
                },
                sort: [{ displayOrder: "asc" }],
                _source: { includes: [] },
            },
            from: 0,
            size: 100,
        });

        const sections = categories.body.hits.hits.map(
            (category) => category._source.description
        );

        return sections;
    };

    getArticlesByCategory = async (
        categoryId = "a9d20b0a-7689-e3f6-ca0f-c6a0a5bb44d1"
    ) => {
        const response = await this.getArticles({
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    default_field: "merchantId",
                                    query: this.merchantId,
                                },
                            },
                            {
                                match: {
                                    languageId:
                                        "838aef56-78bb-11e6-b5a6-00155d582814",
                                },
                            },
                            {
                                match: {
                                    "categories.id": categoryId,
                                },
                            },
                        ],
                        must_not: [],
                    },
                },
                sort: [{ createdDate: "desc" }],
                _source: {
                    includes: [
                        "id",
                        "name",
                        "subDescription",
                        "images",
                        "createdDate",
                    ],
                },
            },
            from: 0,
            size: 1000,
        });

        const articles = response.body.hits.hits.map(
            (article) => article._source
        );

        return articles;
    };

    getProductsByCategory = async (categoryId) => {
        const response = await this.getProducts({
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    default_field: "merchantId",
                                    query: this.merchantId,
                                },
                            },
                            {
                                match: {
                                    languageId:
                                        "838aef56-78bb-11e6-b5a6-00155d582814",
                                },
                            },
                            {
                                match: {
                                    "categories.id": categoryId,
                                },
                            },
                        ],
                        must_not: [],
                    },
                },
                sort: [{ createdDate: "desc" }],
                _source: {
                    includes: [
                        "id",
                        "name",
                        "subDescription",
                        "images",
                        "createdDate",
                    ],
                },
            },
            from: 0,
            size: 1000,
        });

        const products = response.body.hits.hits.map(
            (product) => product._source
        );

        return products;
    };

    getCategoryById = async (id) => {
        const response = await this.getCategories({
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    default_field: "merchantId",
                                    query: this.merchantId,
                                },
                            },
                            {
                                match: {
                                    languageId:
                                        "838aef56-78bb-11e6-b5a6-00155d582814",
                                },
                            },
                            {
                                match: {
                                    id: id,
                                },
                            },
                        ],
                        must_not: [],
                    },
                },
                sort: [],
                _source: {
                    includes: [
                        "id",
                        "name",
                        "subDescription",
                        "images",
                        "createdDate",
                    ],
                },
            },
            from: 0,
            size: 1,
        });

        const categories = await response.body.hits.hits.map(
            (product) => product._source
        );

        return categories[0];
    };

    getCategoriesByType = async (type, matchs = {}) => {
        const response = await this.getCategories({
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    default_field: "merchantId",
                                    query: this.merchantId,
                                },
                            },
                            {
                                match: {
                                    languageId:
                                        "838aef56-78bb-11e6-b5a6-00155d582814",
                                },
                            },
                            {
                                match: {
                                    type: type,
                                },
                            },
                            ...Object.keys(matchs).map((key) => ({
                                match: {
                                    [key]: matchs[key],
                                },
                            })),
                        ],
                        must_not: [],
                    },
                },
                sort: [{ displayOrder: "asc" }],
                _source: {
                    includes: [
                        "id",
                        "name",
                        "subDescription",
                        "description",
                        "images",
                        "createdDate",
                    ],
                },
            },
            from: 0,
            size: 1000,
        });

        const categories = await response.body.hits.hits.map(
            (category) => category._source
        );

        return categories;
    };
}

// const eInstance = new ElasticClient();

module.exports = ElasticClient;
