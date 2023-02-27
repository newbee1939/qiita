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

async function makeLikesRanking() {
  let apiRequestCount = 0;
  const createdAtRangeList = makeCreatedAtRangeList();
  const likesRanking = createdAtRangeList.map(async (createdAtRange) => {
    let pageNumber = 1;
    let allResponseData = [];

    while (true) {
      const responseData = (
        await axios.get("https://qiita.com//api/v2/items", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            query: createdAtRange,
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
      apiRequestCount++;

      if (responseData.length === 0) {
        break;
      }

      allResponseData.push(responseData);

      pageNumber++;
    }

    const likesRanking = allResponseData.flat();

    return likesRanking;
  });

  console.log(`APIのリクエスト回数は${apiRequestCount}回です`);

  return likesRanking
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
          .replace("rank", makeRank(index + 1))
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

export const formatDate = (dateTime: string): string => {
  const date: Date = new Date(dateTime);

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

// TODO:このあたりhelperとして共通化する
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
