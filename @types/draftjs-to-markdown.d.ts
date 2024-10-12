declare module "draftjs-to-markdown" {
    import { RawDraftContentState } from "draft-js";

    function draftToMarkdown(rawContent: RawDraftContentState): string;

    export = draftToMarkdown;
}
