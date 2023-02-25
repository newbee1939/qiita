import axios from "axios";

const accessToken = process.env.ACCESS_TOKEN;

makeStocksRankingArticle();

async function makeStocksRankingArticle() {
  const stocksRanking = await makeStocksRanking();
  console.log(stocksRanking);
}

async function makeStocksRanking() {
  let pageNumber = 1;
  let allData: any = [];
  while (true) {
    const responseData = (
      await axios.get("https://qiita.com//api/v2/items", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          query: "stocks:>4000",
          page: pageNumber,
          per_page: 30,
        },
      })
    ).data.map((qiita: any) => {
      return {
        title: qiita.title,
        stocksCount: qiita.stocks_count,
      };
    });

    allData.push(responseData);

    if (responseData.length === 0) {
      console.log("break");
      break;
    }

    pageNumber++;
  }

  return allData.flat().sort((a: any, b: any) => {
    if (a.stocksCount > b.stocksCount) {
      return -1;
    }
    if (a.stocksCount < b.stocksCount) {
      return 1;
    }
    return 0;
  });
}
