import yargs from "yargs";
import { generators } from "./generators";
import { generateCmd } from "./commands";

const argv = yargs
  .scriptName("butter")
  .usage("$0 <command>")
  .command(
    "generate <target> [options]",
    "Generate code for target environment using files",
    (yargs) => {
      return (
        yargs
          .positional("target", {
            describe: "The target environment for generated code",
            choices: Object.keys(generators),
          })
          .option("f", {
            alias: "files",
            describe: "Input .butter files to parse",
            type: "array",
            demand: true,
            // also: count:true, requiresArg:true
          })
          /*.positional("files", {
          describe: "Input .butter files to parse",
          normalize: true,
        })*/
          .option("o", {
            alias: "output",
            describe: "Output directory",
            default: "./butter-genfiles",
            normalize: true,
          })
      );
    },
    (argv) => {
      generateCmd({
        target: argv.target,
        files: argv.f.map((a) => a.toString()),
        outputDir: argv.o,
      });
    }
  )
  .demandCommand()
  .help().argv;
