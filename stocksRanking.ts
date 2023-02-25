import axios from "axios";

const accessToken = process.env.ACCESS_TOKEN;

makeStocksRankingArticle();

async function makeStocksRankingArticle() {
  const stocksRanking = await makeStocksRanking();

  // TODO: ランキングをもとに記事を作成して投稿する
  await makeAndPostArticle();

  console.log(stocksRanking);
}

async function makeStocksRanking() {
  let pageNumber = 1;
  let allResponseData: any = [];
  while (true) {
    const responseData = (
      await axios.get("https://qiita.com//api/v2/items", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          query: "stocks:>2000",
          page: pageNumber,
          per_page: 100,
        },
      })
    ).data.map((article: any) => {
      return {
        title: article.title,
        stocksCount: article.stocks_count,
      };
    });

    if (responseData.length === 0) {
      break;
    }

    allResponseData.push(responseData);

    pageNumber++;
  }

  const stocksRanking = allResponseData.flat().sort((a: any, b: any) => {
    if (a.stocksCount > b.stocksCount) {
      return -1;
    }
    if (a.stocksCount < b.stocksCount) {
      return 1;
    }
    return 0;
  });

  return stocksRanking;
}

// TODO:一回目投稿した後は更新にしたいけどどうする？
async function makeAndPostArticle() {
  const articleInformation = {
    title: "【保存版】Qiitaの歴代ストック数ランキング100",
    body: fs.readFileSync("path/to/markdown.md", "utf-8"),
    tags: [{ name: "TypeScript" }, { name: "Qiita API" }],
  };

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  axios
    .post("https://qiita.com/api/v2/items", articleInformation, { headers })
    .then((response) => {
      console.log("投稿が完了しました");
    })
    .catch((error) => {
      console.error(error);
    });
}
