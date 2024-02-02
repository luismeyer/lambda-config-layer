import { config as loadEnv } from "dotenv";
import {
  LambdaClient,
  LambdaClientConfig,
  PublishLayerVersionCommand,
  UpdateFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";
import { existsSync, opendirSync, readFileSync } from "fs";
import JSZip from "jszip";
import { FileName, LayerPath } from "./const";

function isEmptyDir(path: string) {
  try {
    const directory = opendirSync(path);
    const entry = directory.readSync();
    directory.closeSync();

    return entry === null;
  } catch (error) {
    return false;
  }
}

function readData(config: string | object) {
  if (typeof config === "string") {
    console.info("reading config file from disk", config);

    if (!existsSync(config)) {
      throw new Error(`Config file '${config}' does not exist.`);
    }

    if (isEmptyDir(config)) {
      throw new Error(`Config file '${config}' is empty.`);
    }

    return readFileSync(config, "utf8");
  }

  if (typeof config === "object") {
    console.info("stringifying config object");

    return JSON.stringify(config);
  }

  throw new Error("Config must be a string or an object.");
}

type DeployOptions = {
  region?: string;
  credentials?: LambdaClientConfig["credentials"];
};

export async function deploy(
  lambdaNames: string[],
  config: string | object,
  options?: DeployOptions
) {
  loadEnv();

  const data = readData(config);

  console.info("zipping layer");

  const zip = new JSZip();
  const zipDir = zip.folder(LayerPath);
  zipDir?.file(FileName, data);

  console.info("generating zip");

  const archive = await zip.generateAsync({ type: "blob" });

  const id = `${lambdaNames}-ConfigLayerLambdaLayer`;

  const lambdaClient = new LambdaClient({
    region: options?.region,
    credentials: options?.credentials,
  });

  console.info("publishing layer");
  const response = await lambdaClient.send(
    new PublishLayerVersionCommand({
      LayerName: id,
      Content: { ZipFile: new Uint8Array(await archive.arrayBuffer()) },
    })
  );

  if (!response.LayerArn || !response.LayerVersionArn) {
    throw new Error("Could not publish layer.");
  }

  const arn = response.LayerVersionArn;

  console.info("updating lambda functions");

  await Promise.all(
    lambdaNames.map(async (lambdaName) =>
      lambdaClient.send(
        new UpdateFunctionConfigurationCommand({
          FunctionName: lambdaName,
          Layers: [arn],
        })
      )
    )
  );

  return { arn, id };
}
