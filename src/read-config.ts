import { readFile } from "fs/promises";

import { ConfigPath } from "./const";

export async function readConfig<T extends object>() {
  try {
    const configData = await readFile(ConfigPath, "utf8");

    return JSON.parse(configData) as T;
  } catch (error) {
    console.error("error reading config file", error);

    return undefined;
  }
}
