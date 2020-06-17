import { ButteryFile, Reference } from "./ast";
import fs from "fs";
import { resolve } from "./resolve";
import { parse } from "./parser";
import { lexer, Token } from "./lexer";
import { stream } from "parser-ts/lib/Stream";
import { isLeft } from "fp-ts/lib/Either";
import { ParseError } from "parser-ts/lib/ParseResult";
import { indentify } from "./indenter";
import { validate } from "./validator";

const getParseErrorMessage = (error: ParseError<Token>) => {
  const errorChar = error.input.buffer[error.input.cursor].token;
  return `Parse Error: Expected ${error.expected}, but got ${errorChar}`;
};

const errorPadding = 30;
const getTokenizerErrorMessage = (error: ParseError<string>) => {
  const { buffer, cursor } = error.input;
  const start = Math.max(0, cursor - errorPadding);
  const end = Math.min(buffer.length - 1, cursor + errorPadding);

  const pre = buffer
    .slice(start, cursor)
    .join("")
    .replace(/^(.*\n)*\s*/g, "");
  const post = buffer
    .slice(cursor + 1, end)
    .join("")
    .replace(/(\n.*)*$/g, "");
  return `Tokenizer Error: Expected ${error.expected}, but got "${
    buffer[cursor]
  }":
${pre}${buffer[cursor]}${post}
${" ".repeat(pre.length)}^
`;
};

export function loadButteryFile(fname: string): ButteryFile<Reference> {
  const contents = fs.readFileSync(fname, "utf8");

  const tokenized = lexer(stream(contents.split(""), 0));
  if (isLeft(tokenized)) {
    throw new Error(getTokenizerErrorMessage(tokenized.left));
  }

  // This can't fail, fortunately!
  const indented = indentify(tokenized.right.value);

  const parsed = parse(indented, fname);
  if (isLeft(parsed)) {
    throw new Error(getParseErrorMessage(parsed.left));
  }
  const validated = validate(parsed.right.value);
  if (!isLeft(validated)) {
    throw validated.right;
  }
  return validated.left;
}

export function load(path: string) {
  const startFile = loadButteryFile(path);
  // This should be done via an either.
  return resolve(startFile, loadButteryFile);
}
