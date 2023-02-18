import ITempPlugin from "./main";
import { ITempParser } from "./parser";

export class ITemp {
    constructor(private plugin: ITempPlugin) {}

    async setup(): Promise<void> {
        this.plugin.registerMarkdownPostProcessor((el, ctx) => {
            el.innerHTML = this.replace_templates(el.innerHTML);
        });
    }

    replace_templates(content: string): string {
        let parser = new ITempParser(content, this.plugin);

        console.log(content);

        return parser.process_content();
    }
}