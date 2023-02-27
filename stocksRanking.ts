import axios from "axios";
import * as fs from "node:fs/promises";
import dotenv from "dotenv";
dotenv.config();

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

// TODO:一回目投稿した後は更新にしたい
// 一度投稿したらこれに変更で良さそう（https://qiita.com/api/v2/docs#patch-apiv2itemsitem_id）
async function makeAndPostArticle(stocksRanking: any) {
  const articleInformation = {
    title: "【保存版】Qiita歴代ストック数ランキング100",
    body: await makeArticleBody(stocksRanking),
    private: true,
    tags: [
      { name: "TypeScript" },
      { name: "QiitaAPI" },
      { name: "Qiita" },
      { name: "JavaScript" },
      { name: "初心者" },
    ],
  };

  try {
    await axios.post("https://qiita.com/api/v2/items", articleInformation, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    console.log("投稿が完了しました！");
  } catch (e) {
    console.log(e);
    console.log("投稿に失敗しました。。");
  }
}

async function makeArticleBody(stocksRanking: any) {
  const lead = "※この記事は定期的に更新して最新状態を保ちます<br>";
  const articleBody = stocksRanking.reduce(
    async (prevArticleBody: string, rankingData: any, index: number) => {
      const content = await fs.readFile("stocksRanking.md", "utf-8");
      return (
        (await prevArticleBody) +
        content
          .replace("rank", makeRank(index + 1))
          .replace("title", rankingData.title)
          .replace("stock", rankingData.stocksCount)
          .replace("url", rankingData.url)
          .replace("createdAt", formatDate(rankingData.createdAt))
          .replace("updatedAt", formatDate(rankingData.updatedAt))
      );
    },
    lead
  );

  return articleBody;
}

export const formatDate = (dateTime: string): string => {
  const date: Date = new Date(dateTime);

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

function makeRank(rank: number) {
  if (rank === 1) {
    return '<font color="#EFAF00">1位</font>';
  }
  if (rank === 2) {
    return '<font color="#BBBDC0">2位</font>';
  }
  if (rank === 3) {
    return '<font color="#C47222">3位</font>';
  }
  return `${rank}位`;
}
