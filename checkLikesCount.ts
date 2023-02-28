import axios from "axios";
import dotenv from "dotenv";
import { makeCreatedAtRangeList } from "./helper/makeCreatedAtRangeList";
dotenv.config();

const accessToken = process.env.ACCESS_TOKEN;

execute();

async function execute() {
  if (await checkLikesCount()) {
    console.log("大丈夫そうですう！！");
  }
  console.log(
    "1000ストック以下の記事でいいね数が1000以上の記事が存在しています。。"
  );
}

// 1000ストック以下の記事でいいね数が1000以上の記事がないことをチェックする
// このチェックに通ったら、「1000ストックより大きい」でlikesRankingの条件を絞ることができる
async function checkLikesCount(): Promise<boolean> {
  const createdAtRangeList = await makeCreatedAtRangeList();

  for (const createdAtRange of createdAtRangeList) {
    let pageNumber = 1;
    while (true) {
      const responseData = (
        await axios.get("https://qiita.com/api/v2/items", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            query: `${createdAtRange} stocks:<=1000`,
            page: pageNumber,
            per_page: 100,
          },
        })
      ).data.map((article: any) => {
        return {
          title: article.title,
          likesCount: article.likes_count,
          url: article.url,
        };
      });

      if (responseData.length === 0) {
        break;
      }

      const filteredResponseData = responseData.filter((article: any) => {
        return article.likes_count >= 1000;
      });

      if (filteredResponseData.length !== 0) {
        console.log(filteredResponseData);
        return false;
      }

      pageNumber++;
    }
  }

  return true;
}
