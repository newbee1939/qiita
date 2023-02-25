import axios from "axios";

const accessToken = process.env.ACCESS_TOKEN;

makeStocksRankingArticle();

async function makeStocksRankingArticle() {
  const stocksRanking = await makeStocksRanking();

  // TODO: ランキングをもとに記事を作成して投稿する
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
