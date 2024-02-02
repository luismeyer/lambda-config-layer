import { readConfig } from "../../src";

type Config = {
  hello: string;
  flag: boolean;
};

export const handler = async () => {
  const configData = await readConfig<Config>();

  if (configData?.flag) {
    return {
      statusCode: 200,
      headers: { "content-type": "text/html" },
      body: "<h1>It works!</h1>",
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ hello: configData?.hello }, null, 2),
  };
};
