import { Token } from "./lexer";

export function indentify(tokens: Token[]): Token[] {
  let indents = 0;
  let currentIndentStreak = 0;
  const out: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const currentToken = tokens[i];
    if (currentToken.token === "indent") {
      currentIndentStreak++;
    } else {
      if (currentIndentStreak) {
        const deltaIndents = currentIndentStreak - indents;
        if (deltaIndents > 0) {
          for (let j = 0; j < deltaIndents; j++) {
            out.push({
              token: "shiftIn",
            });
          }
        } else if (deltaIndents < 0) {
          for (let j = 0; j < -deltaIndents; j++) {
            out.push({
              token: "shiftOut",
            });
          }
        }
        indents = currentIndentStreak;
        currentIndentStreak = 0;
      }
      out.push(currentToken);
    }
  }
  for (let j = 0; j < indents; j++) {
    out.push({
      token: "shiftOut",
    });
  }
  return out;
}
