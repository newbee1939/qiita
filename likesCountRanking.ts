import axios from "axios";
import * as fs from "node:fs/promises";
import dotenv from "dotenv";
dotenv.config();

const accessToken = process.env.ACCESS_TOKEN;

makeLikesRankingArticle();

async function makeLikesRankingArticle() {
  const likesRanking = await makeLikesRanking();
  await makeAndPostArticle(likesRanking);
}

// Qiitaは2011年9月16日からサービス開始
// そこから現在時刻までのいいね数ランキングを作る
async function makeLikesRanking() {
  const createdAtRangeList = makeCreatedAtRangeList();
  const hoge = createdAtRangeList.map(() => {
    //
  });

  let pageNumber = 1;
  let allResponseData = [];
  // ここでqueryの文字列でmapで良さそう。どの範囲で10000件の制限を超えたかは分かるようにする
  // 1,2,3位はランキングの文字の色を変えても楽しそう（https://qiita.com/tommy_aka_jps/items/7ad9e53872532336de38）

  while (true) {
    const responseData = (
      await axios.get("https://qiita.com//api/v2/items", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          // ここを徐々に増やしていけば良さそう。この文字列のリストを作ってmapとかでも良さそう
          query: "created:>2011-09-01 created:<2011-10-01",
          page: pageNumber,
          per_page: 100,
        },
      })
    ).data.map((article: any) => {
      return {
        title: article.title,
        likesCount: article.likes_count,
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

  const likesRanking = allResponseData
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

  return likesRanking;
}

// TODO:一回目投稿した後は更新にしたい
// 一度投稿したらこれに変更で良さそう（https://qiita.com/api/v2/docs#patch-apiv2itemsitem_id）
async function makeAndPostArticle(likesRanking: any) {
  const articleInformation = {
    title: "【保存版】Qiita歴代いいね数ランキング100",
    body: await makeArticleBody(likesRanking),
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
    // APIを叩いた回数を出したい
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

async function makeArticleBody(likesRanking: any) {
  const lead = "※この記事は定期的に更新して最新状態を保ちます<br>";
  const articleBody = likesRanking.reduce(
    async (prevArticleBody: string, rankingData: any, index: number) => {
      const content = await fs.readFile("likesRanking.md", "utf-8");
      return (
        (await prevArticleBody) +
        content
          .replace("rank", `${index + 1}`)
          .replace("title", rankingData.title)
          .replace("like", rankingData.likesCount)
          .replace("url", rankingData.url)
          .replace("createdAt", formatDate(rankingData.createdAt))
          .replace("updatedAt", formatDate(rankingData.updatedAt))
      );
    },
    lead
  );

  return articleBody;
}

function formatDate(dateTime: string): string {
  const date: Date = new Date(dateTime);

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function makeCreatedAtRangeList() {
  const createdAtRangeList = [];
  for (
    let year = 11;
    year <= Number(new Date().getFullYear().toString().replace("20", ""));
    year++
  ) {
    for (let month = 1; month <= 12; month++) {
      if (month === 12) {
        createdAtRangeList.push(
          `created:>=20${year}-12-01 created:<20${year + 1}-01-01`
        );
      } else {
        createdAtRangeList.push(
          `created:>=20${year}-${month
            .toString()
            .padStart(2, "0")}-01 created:<20${year}-${(month + 1)
            .toString()
            .padStart(2, "0")}-01`
        );
      }
    }
  }

  return createdAtRangeList;
}
