declare module "tree-sitter" {
  export class Parser {
    setLanguage(language: any): void;
    parse(text: string): Tree;
  }
  export interface Tree {
    rootNode: SyntaxNode;
  }
  export interface SyntaxNode {
    type: string;
    startPosition: { row: number; column: number };
    endPosition: { row: number; column: number };
    startIndex: number;
    endIndex: number;
    isNamed: boolean;
    children: SyntaxNode[];
  }
}

declare module "tree-sitter-javascript" {
  const language: any;
  export default language;
}

declare module "tree-sitter-javascript/bindings/node/index.js" {
  const language: any;
  export default language;
}

declare module "tree-sitter-typescript/bindings/node/index.js" {
  export const typescript: any;
  export const tsx: any;
}

declare module "pennylane" {
  export const qml: any;
  export const qnode: any;
}

declare module "pennylane.numpy" {
  export const random: any;
  export const ones: any;
  export const array: any;
  export const argmin: any;
  export const seed: any;
}

declare module "semver" {
  export function satisfies(version: string, range: string): boolean;
  export function gt(a: string, b: string): boolean;
  export function rcompare(a: string, b: string): number;
  export function major(version: string): number;
  export function coerce(version: string): any;
  export const SEMVER_SPEC_VERSION: string;
  const semver: {
    satisfies: typeof satisfies;
    gt: typeof gt;
    rcompare: typeof rcompare;
    major: typeof major;
    coerce: typeof coerce;
  };
  export default semver;
}