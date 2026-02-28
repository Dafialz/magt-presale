import { compile, NetworkProvider } from "@ton/blueprint";

export async function run(provider: NetworkProvider) {
  await compile("Presale");
}
