import { Token } from "./lexer";

export function compressNewlines(tokens: Token[]): Token[] {
  const out = tokens.filter((item, pos, array) => {
    // Keep all non-newlines
    if (item.token !== "newline") {
      return true;
    }

    // Drop any leading newlines
    if (pos === 0) {
      return false;
    }
    // Drop any newlines after newlines
    if (array[pos - 1].token === "newline") {
      return false;
    }
    return true;
  });

  // Remove a final newline if it exists
  if (out.length !== 0 && out[out.length - 1].token === "newline") {
    out.pop();
  }
  return out;
}

export function indentify(tokens: Token[]): Token[] {
  let indents = 0;
  let currentIndentStreak = 0;
  const out: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const currentToken = tokens[i];
    if (currentToken.token === "indent") {
      currentIndentStreak++;
      continue;
    } else if (
      i > 0 &&
      tokens[i - currentIndentStreak - 1].token === "newline"
    ) {
      const deltaIndents = currentIndentStreak - indents;
      if (deltaIndents > 0) {
        for (let j = 0; j < deltaIndents; j++) {
          out.push({
            token: "shiftIn",
          });
        }
      } else if (deltaIndents < 0) {
        for (let j = 0; j < -deltaIndents; j++) {
          // Tuck the shiftOut in before the token that broke the streak :)
          const prev = out.pop();
          out.push({
            token: "shiftOut",
          });
          prev && out.push(prev);
        }
      }
      indents = currentIndentStreak;
      currentIndentStreak = 0;
    }
    out.push(currentToken);
  }

  // Remove the last newline character on a file... this is probably
  // indicative of some bad interactions between indenter and lexer, but
  // whatever...
  if (out.length && out[out.length - 1].token === "newline") {
    out.pop();
  }

  for (let j = 0; j < indents; j++) {
    out.push({
      token: "shiftOut",
    });
  }
  return out;
}

export const postLex = (tokens: Token[]): Token[] => {
  return indentify(compressNewlines(tokens));
};
