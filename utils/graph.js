const gql = require("graphql-tag");
const ApolloClient = require("apollo-client").ApolloClient;
const fetch = require("node-fetch");
const config = require("./config");
const createHttpLink = require("apollo-link-http").createHttpLink;
const setContext = require("apollo-link-context").setContext;
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache;

const httpLink = createHttpLink({
    uri: "https://apicms.izzi.asia/graphql/",
    fetch: fetch,
});

exports.gClient = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
});

exports.getQueryMulti = (
    name = "users",
    params = {},
    items = ["id", "name"]
) => {
    return gql(`
    query {
        ${name}(
            param: {
                keyword: "${params.keyword ? params.keyword : ""}", 
                limit: ${params.limit ? params.limit : 5}, 
                offset: ${params.offset ? params.offset : 0}, 
                order: "${params.order ? params.order : "desc"}", 
                sort: "${params.sort ? params.sort : "createdDate"}", 
                languageId: "${
                    params.languageId ? params.languageId : config.languageVi
                }", 
                merchantId: "${
                    params.merchantId ? params.merchantId : config.merchantId
                }",
                ${params.themeWebId ? `themeWebId:"${params.themeWebId}",` : ""}
                ${
                    params.categoryId
                        ? `categoryIds:"${params.categoryId}"`
                        : ""
                },
            }
        ) {
            totalCount
            message
            success
            items {
                ${items.reduce((acc, cur) => acc + "\n" + cur, "")}
            }
        }
    }
`);
};

exports.getQuerySingle = (
    name = "article",
    params,
    items = ["id", "name", "subDescription", "images {id, name}", "description"]
) => {
    const strQuery = `
    query {
        ${name}(
            param: {
                id:"${params.id}",
                languageId: "${
                    params.languageId ? params.languageId : config.languageVi
                }", 
                merchantId: "${
                    params.merchantId ? params.merchantId : config.merchantId
                }"
            }
        ) {
            ${items.reduce((acc, cur) => acc + "\n" + cur, "")}
        }
    }
`;
    return gql(strQuery);
};

exports.queryGraph = async (type, name, params, items) => {
    let query;
    switch (type) {
        case "single":
            query = this.getQuerySingle(name, params, items);
            break;
        case "multiple":
            query = this.getQueryMulti(name, params, items);
            break;
        default:
            throw Error("type error");
    }

    const result = await this.gClient.query({
        query: query,
    });
    return result.data;
};
