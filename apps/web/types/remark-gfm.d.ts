/**
 * Type declarations for remark-gfm
 * @see https://github.com/remarkjs/remark-gfm
 */

declare module "remark-gfm" {
  import { Plugin } from "unified";

  export interface RemarkGfmOptions {
    singleTilde?: boolean;
    tableCellPadding?: boolean;
    tablePipeAlign?: boolean;
    stringLength?: (value: string) => number;
  }

  const remarkGfm: Plugin<[RemarkGfmOptions?], unknown>;
  export default remarkGfm;
}
