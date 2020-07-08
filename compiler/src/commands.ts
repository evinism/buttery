import path from "path";
import fs from "fs";
import { generators } from "./generators";
import { GenFile } from "./generators/types";
import child_process from "child_process";

import { load } from "./pipeline";

interface GenerateCmdConfig {
  target: string;
  files: string[];
  outputDir: string;
}

/* TODO: Move to non-sync versions of fs ops */
export function generateCmd({ target, files, outputDir }: GenerateCmdConfig) {
  console.log(`[ Buttery ]`);
  const startTime = Date.now();

  const generate = generators[target];
  if (!generate) {
    throw "This shouldn't happen, but generateCmd called w/ generator that dont exist";
  }
  console.log("  Generating files for target ${target}");

  // validate that all the target files exist.
  for (let fname of files) {
    if (!fs.existsSync(fname)) {
      throw new Error(`Could not find input file ${fname}`);
    }
  }

  // Create the output dir if necessary
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  let outfiles: GenFile[] = [];
  let postGenerates: string[] = [];
  for (let fname of files) {
    const { genfiles, postGenerate } = generate(load(fname));
    outfiles = outfiles.concat(genfiles);
    if (postGenerate) {
      postGenerates = postGenerates.concat(postGenerate(outputDir));
    }
  }
  for (let outfile of outfiles) {
    const parentDirOfOutfile = path.join(
      outputDir,
      path.dirname(outfile.fileName)
    );
    if (parentDirOfOutfile && !fs.existsSync(parentDirOfOutfile)) {
      fs.mkdirSync(parentDirOfOutfile, { recursive: true });
    }
    fs.writeFileSync(path.join(outputDir, outfile.fileName), outfile.content);
  }

  if (postGenerates.length > 0) {
    console.log("  Running post-generation scripts...");
  }
  for (let cmd of postGenerates) {
    child_process.execSync(cmd, { encoding: "utf-8" });
  }
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`  Success! (${duration}s)`);
}
