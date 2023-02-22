import ITempPlugin from "./main";
import { ITempParser, ITempTemplate } from "./parser";

export class ITemp {
    constructor(private plugin: ITempPlugin) {}

    async setup(): Promise<void> {
        this.plugin.registerMarkdownPostProcessor((el, ctx) => {
            el.innerHTML = this.replace_templates(el.innerHTML);
        });
    }

    replace_templates(content: string): string {
        let parser = new ITempParser(content,
            0,
            true);

        let tree = parser.parse_line();

        let result = "";

        for (let i = 0; i < tree.length; i++) {
            if (typeof tree[i] == "string")
                result = result + tree[i];
            else
                result = result + (tree[i] as ITempTemplate).expand(true, this.plugin);
        }

        return result;
    }
}