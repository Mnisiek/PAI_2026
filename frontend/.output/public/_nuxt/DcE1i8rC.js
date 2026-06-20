import{Q as o,R as e}from"./DnUmWf34.js";const s=`query GetCategories {\r
  offersModule {\r
    rootCategories {\r
      id\r
      name\r
      slug\r
      parentId\r
      isLeaf\r
      children {\r
        id\r
        name\r
        slug\r
        parentId\r
        isLeaf\r
      }\r
    }\r
  }\r
}\r
`,u=`query GetProducts($filter: ProductFilter) {\r
  offersModule {\r
    products(filter: $filter) {\r
      total\r
      items {\r
        id\r
        slug\r
        name\r
        description\r
        mainImageUrl\r
        priceFrom {\r
          amount\r
          currency\r
        }\r
        offers {\r
          id\r
          sku\r
          price {\r
            amount\r
            currency\r
          }\r
          stock\r
          status\r
          attributes {\r
            code\r
            name\r
            dataType\r
            unit\r
            textValue\r
            numValue\r
            boolValue\r
          }\r
        }\r
        brand {\r
          id\r
          name\r
          slug\r
        }\r
        category {\r
          id\r
          name\r
          slug\r
          parentId\r
          isLeaf\r
        }\r
      }\r
    }\r
  }\r
}\r
`,i=`query GetProduct($slug: ID!) {\r
  offersModule {\r
    product(slug: $slug) {\r
      id\r
      slug\r
      name\r
      description\r
      mainImageUrl\r
      priceFrom {\r
        amount\r
        currency\r
      }\r
      offers {\r
        id\r
        sku\r
        price {\r
          amount\r
          currency\r
        }\r
        stock\r
        status\r
        attributes {\r
          code\r
          name\r
          dataType\r
          unit\r
          textValue\r
          numValue\r
          boolValue\r
        }\r
      }\r
      specs {\r
        key\r
        value\r
      }\r
      brand {\r
        id\r
        name\r
        slug\r
      }\r
      category {\r
        id\r
        name\r
        slug\r
        parentId\r
        isLeaf\r
      }\r
    }\r
  }\r
}\r
`,c=o(s),d=o(u),l=o(i),t=r=>new Promise(n=>{setTimeout(n,r)}),a=()=>250+Math.floor(Math.random()*550),g=r=>r.flatMap(n=>[n,...n.children??[]]),m={async getCategories(){await t(a());const{data:r}=await e.query({query:c});if(!r)throw new Error("Categories query returned no data.");return g(r.offersModule.rootCategories)},async getProducts(r){await t(a());const{data:n}=await e.query({query:d,variables:{filter:r}});if(!n)throw new Error("Products query returned no data.");return n.offersModule.products.items},async getProductBySlug(r){await t(a());const{data:n}=await e.query({query:l,variables:{slug:r}});if(!n)throw new Error("Product query returned no data.");return n.offersModule.product}};export{m as c};
