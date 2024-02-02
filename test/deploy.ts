import { resolve } from "path";

import { deploy } from "../src";

async function main() {
  const result = await deploy(
    ["config-layer-test-dev-api"],
    resolve(__dirname, "./config.json"),
    { region: "eu-central-1" }
  );

  console.log(result);
}

main();
