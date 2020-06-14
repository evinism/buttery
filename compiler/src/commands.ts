import path from "path";
import fs from "fs";
import { generators } from "./generators";
import { GenFile } from "./generators/types";

import { load } from "./pipeline";

interface GenerateCmdConfig {
  target: string;
  files: string[];
  outputDir: string;
}

/* TODO: Move to non-sync versions of fs ops */
export function generateCmd({ target, files, outputDir }: GenerateCmdConfig) {
  const generate = generators[target];
  if (!generate) {
    throw "This shouldn't happen, but generateCmd called w/ generator that dont exist";
  }
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
  for (let fname of files) {
    outfiles = outfiles.concat(generate(load(fname)));
  }
  for (let outfile of outfiles) {
    fs.writeFileSync(path.join(outputDir, outfile.fileName), outfile.content);
  }
}
