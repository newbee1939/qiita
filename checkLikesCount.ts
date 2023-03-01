import axios from "axios";
import dotenv from "dotenv";
import { makeCreatedAtRangeList } from "./helper/makeCreatedAtRangeList";
dotenv.config();

// それかトークンを複数発行する？
const accessToken = process.env.ACCESS_TOKEN;

execute();

async function execute() {
  if (await checkLikesCount()) {
    console.log("大丈夫そうですう！！");
  }
  console.log(
    "500ストック以下の記事でいいね数が2000以上の記事が存在しています。。"
  );
}

// TODO:ログをファイルに出すようにする
// 500ストック以下の記事でいいね数が2000以上の記事がないことをチェックする
// このチェックに通ったら、「500ストックより大きい」でlikesRankingの条件を絞ることができる
async function checkLikesCount(): Promise<boolean> {
  const createdAtRangeList = await makeCreatedAtRangeList();
  let apiCount = 0;

  for (const createdAtRange of createdAtRangeList) {
    if (apiCount === 1000) {
      function hoge() {
        console.log("3秒経ちました！");
      }
      setInterval(() => {
        console.log(
          "1時間が経過したので1000リクエストの制約が解除されました。"
        );
      }, 3600000);
      apiCount = 0;
    }

    console.log(`-----${createdAtRange}がスタート-----`);

    // とりあえずcreated:>=2015-08-01 created:<2015-09-01まではスキップで良さそう。いい方法ある？
    const createdAtSkipRangeList: string[] = []; // 処理をスキップする createdAtRange を指定する
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
            query: `${createdAtRange} stocks:<=500`,
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
      console.log(`現在APIを${apiCount}回叩いています。`);

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
