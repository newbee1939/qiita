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
    "800ストック以下の記事でいいね数が2000以上の記事が存在しています。。"
  );
}

// 800ストック以下の記事でいいね数が2000以上の記事がないことをチェックする
// このチェックに通ったら、「800ストックより大きい」でlikesRankingの条件を絞ることができる
async function checkLikesCount(): Promise<boolean> {
  const createdAtRangeList = await makeCreatedAtRangeList();
  let apiCount = 0;

  for (const createdAtRange of createdAtRangeList) {
    console.log(`-----${createdAtRange}がスタート-----`);

    const createdAtSkipRangeList = []; // 処理をスキップする createdAtRange を指定する
    if (createdAtSkipRangeList.includes(createdAtRange)) {
      break;
    }

    let pageNumber = 1;
    while (true) {
      if (pageNumber > 100) {
        console.log(`${createdAtRange}ではpageNumberが100を超えました。。`);
        break;
      }

      const responseData = (
        await axios.get("https://qiita.com/api/v2/items", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            query: `${createdAtRange} stocks:<=800`,
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
      apiCount++;
      console.log(`現在APIを${apiCount}叩いています。`);

      if (responseData.length === 0) {
        break;
      }

      const filteredResponseData = responseData.filter((article: any) => {
        return article.likes_count >= 2000;
      });

      if (filteredResponseData.length !== 0) {
        console.log(filteredResponseData);
        return false;
      }

      pageNumber++;
    }

    console.log(`-----${createdAtRange}はOK！-----`);
  }

  return true;
}
