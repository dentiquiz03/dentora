declare module "papaparse" {
  export interface ParseError { type: string; code: string; message: string; row?: number; }
  export interface ParseMeta { fields?: string[]; }
  export interface ParseResult<T> { data: T[]; errors: ParseError[]; meta: ParseMeta; }
  export interface ParseConfig<T> { header?: boolean; skipEmptyLines?: boolean | "greedy"; transformHeader?: (header: string, index: number) => string; complete?: (results: ParseResult<T>, file?: unknown) => void; }
  const Papa: { parse<T>(file: File | string, config: ParseConfig<T>): void; };
  export default Papa;
}
