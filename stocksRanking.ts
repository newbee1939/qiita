import axios from "axios";

const accessToken = process.env.ACCESS_TOKEN;

makeStocksRankingArticle();

async function makeStocksRankingArticle() {
  const stocksRanking = await makeStocksRanking();

  console.log(stocksRanking);

  // TODO: ランキングをもとに記事を作成して投稿する
  await makeAndPostArticle(stocksRanking);
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
        createdAt: article.created_at,
        updatedAt: article.updated_at,
        url: article.url,
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
// 一度投稿したらこれに変更で良さそう（https://qiita.com/api/v2/docs#patch-apiv2itemsitem_id）
async function makeAndPostArticle(stocksRanking: any) {
  const articleInformation = {
    title: "【保存版】Qiitaの歴代ストック数ランキング100",
    body: await fs.readFile("stocksRanking.md", "utf-8"),
    tags: [{ name: "TypeScript" }, { name: "Qiita API" }],
  };

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    await axios.post("https://qiita.com/api/v2/items", articleInformation, {
      headers,
    });
    console.log("投稿が完了しました！");
  } catch (e) {
    console.log(e);
    console.log("投稿に失敗しました。。");
  }
}

// TODO: 実際のマークダウンで試しつつ
async function makeArticleBody(stocksRanking: any) {
  const readSentence =
    "歴代の全ての記事のストック数ランキングを作ってみました。<br>定期的に更新していく予定です。";
  stocksRanking.reduce((prevArticleBody: string, stock: any, index: number) => {
    return `${prevArticleBody}<br>## ${index + 1}位<br>`;
  }, readSentence);
}

// title: article.title,
// stocksCount: article.stocks_count,
// createdAt: article.created_at,
// updatedAt: article.updated_at,
// url: article.url,
