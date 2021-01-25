module.exports = {
    shop: {
        name: "longvb",
        money_format: "d",
        money_with_currency_format: "d",
        currency: "VND",
    },
    products: {
        product: {
            add_to_cart: "Add to Cart",
        },
    },
    routes: {
        root_url: "/",
        search_url: "/search",
        cart_url: "/cart",
        account_url: "/account",
        all_products_collection_url: "/collections"
    },
    linklists: {
        "main-menu": {
            links: [
                {
                    url: "/kk",
                    title: "kk",
                    active: true,
                },
                {
                    url: "/cc",
                    title: "cc",
                },
                {
                    url: "/haha",
                    title: "haha",
                },
                {
                    url: "/lol",
                    title: "lol",
                },
            ],
        },
        footer: {
            links: [
                {
                    url: "/kk",
                    title: "kk",
                    active: true,
                },
                {
                    url: "/cc",
                    title: "cc",
                },
                {
                    url: "/haha",
                    title: "haha",
                },
                {
                    url: "/lol",
                    title: "lol",
                },
            ],
        },
    },
    cart: {
        item_count: 3,
        items: [
            {
                "key": 1,
                "product": {
                    "id": "id-product",

                },
                title: "san pham 1",
                properties: [],
                quantity: 4,
                original_price: 6000,
                final_price: 4000,
                original_line_price: 2000,
                final_line_price: 5000
            }
        ],
        total_price: 10000
    }
};
