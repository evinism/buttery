import { Value } from "./ast";

export type SymbolKey = string;
export type GlobalSymbolTable = { [key: string]: Value<SymbolKey> };
