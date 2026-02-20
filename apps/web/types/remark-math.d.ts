/**
 * Type declarations for remark-math
 * @see https://github.com/remarkjs/remark-math
 */

declare module "remark-math" {
  import { Plugin } from "unified";

  export interface RemarkMathOptions {
    singleDollarTextMath?: boolean;
  }

  const remarkMath: Plugin<[RemarkMathOptions?], unknown>;
  export default remarkMath;
}
