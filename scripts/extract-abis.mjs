import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { basename, join } from "path";

const main = () => {
  const libFolder = "./node_modules/@thirdweb-dev/contracts/abi";
  const destinationFolder = "./abis";
  if (existsSync(destinationFolder)) {
    rmSync(destinationFolder, { recursive: true });
  }
  mkdirSync(destinationFolder);
  const abiFiles = readdirSync(libFolder);
  for (const abiFile of abiFiles) {
    const contractJsonFile = readFileSync(join(libFolder, abiFile), "utf-8");
    const contractJson = JSON.parse(contractJsonFile);
    const abi = contractJson.abi;
    writeFileSync(
      join(destinationFolder, basename(abiFile)),
      JSON.stringify(abi, null, 2),
    );
  }
};

main();
