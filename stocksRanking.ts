import axios from "axios";
import * as fs from "node:fs/promises";

const accessToken = process.env.ACCESS_TOKEN;

makeStocksRankingArticle();

async function makeStocksRankingArticle() {
  const stocksRanking = await makeStocksRanking();
  await makeAndPostArticle(stocksRanking);
}

async function makeStocksRanking() {
  let pageNumber = 1;
  let allResponseData = [];
  while (true) {
    // 1ページ100件ずつデータを取得
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

  const stocksRanking = allResponseData
    .flat()
    .sort((a: any, b: any) => {
      if (a.stocksCount > b.stocksCount) {
        return -1;
      }
      if (a.stocksCount < b.stocksCount) {
        return 1;
      }
      return 0;
    })
    .slice(0, 100);

  return stocksRanking;
}

// TODO:一回目投稿した後は更新にしたいけどどうする？
// 一度投稿したらこれに変更で良さそう（https://qiita.com/api/v2/docs#patch-apiv2itemsitem_id）
async function makeAndPostArticle(stocksRanking: any) {
  const articleInformation = {
    title: "【保存版】Qiitaの歴代ストック数ランキング100",
    body: await makeArticleBody(stocksRanking),
    private: true,
    tags: [
      { name: "TypeScript" },
      { name: "QiitaAPI" },
      { name: "Qiita" },
      { name: "JavaScript" },
    ],
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

async function makeArticleBody(stocksRanking: any) {
  const lead =
    "<strong>Qiitaの歴代の全ての記事のストック数ランキング</strong>を作ってみました。<br><br>ストック数が多いということは、それだけ多くの人が<strong>「定期的に見返したい」</strong>と思ったということ。<br><br>きっと仕事や個人プロジェクトで役立つ知見が詰まっていると思うので、チェックしていただけると幸いです。<br><br>※この記事は定期的に更新して最新状態を保つ予定です<br>";
  stocksRanking.reduce(
    async (prevArticleBody: string, rankingData: any, index: number) => {
      const content = await fs.readFile("stocksRanking.md", "utf-8");
      return (
        prevArticleBody +
        content
          .replace("rank", `${index + 1}`)
          .replace("title", rankingData.title)
          .replace("stock", rankingData.stocksCount)
          .replace("url", rankingData.url)
          .replace("createdAt", rankingData.createdAt)
          .replace("updatedAt", rankingData.updatedAt)
      );
    },
    lead
  );
}
