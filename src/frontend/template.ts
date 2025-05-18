import { getTodayTweets } from "./fetchTweets.ts";

export async function makeDiary(date: Date) {
    const tweets = await getTodayTweets(date);

    return {
        title: lightFormat(date, "yyyy/M/dd"),
        header: [
            "[** Habbit]", " 30min: workout", " 3times: [meditation]", "",
            "[** Task]", "",
            "[** Schedule]", "",
            "[** Tweets]",
            ...tweets.map(t =>
                `- (${t.type}) ${t.text} ${t.link}`),
            "",
            "[** Notes]", "",
        ],
        footer: [
            `[${lightFormat(subDays(date, 1), "yyyy/M/dd")}]←→` +
            `[${lightFormat(addDays(date, 1), "yyyy/M/dd")}]`,
        ],
    };
}
