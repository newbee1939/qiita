import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const accessToken = process.env.ACCESS_TOKEN;

execute();

function execute() {
  if (checkLikesCount()) {
    console.log("大丈夫そうですう");
  }
  console.log(
    "1000ストック以下の記事でいいね数が1000以上の記事が存在しています。。"
  );
}

// 1000ストック以下の記事でいいね数が1000以上の記事がないことをチェックする
// このチェックに通ったら、1000ストック以上でlikesRankingの条件を絞ることができる
async function checkLikesCount() {
  const createdAtRangeList = await makeCreatedAtRangeList();

  for (const createdAtRange of createdAtRangeList) {
    let pageNumber = 1;
    let responseDataOneMonth = [];

    while (true) {
      const responseData = (
        await axios.get("https://qiita.com//api/v2/items", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            query: `${createdAtRange} stocks:<=1000`,
            page: pageNumber,
            per_page: 100,
          },
        })
      ).data.filter((article: any) => {
        return article.likes_count >= 1000;
      });

      if (responseData.length !== 0) {
        return false;
      }

      pageNumber++;
    }
  }
}

async function makeCreatedAtRangeList() {
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
