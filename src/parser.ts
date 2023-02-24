import ITempPlugin from "./main";
import { SelectionRange } from "@codemirror/state"

class ITempMatch {
    public match_open_index: number;
    public match_close_index: number;

    constructor(str: string, cursor: number,
                private open_brace_regex: RegExp,
                private close_brace_regex: RegExp) {
        let match_open = this.open_brace_regex.exec(str.substring(cursor));
        let match_close = this.close_brace_regex.exec(str.substring(cursor));
    
        this.match_open_index = this.match_close_index = -1;

        if (match_open !== null)
            this.match_open_index = match_open.index + cursor;
        if (match_close !== null)
            this.match_close_index = match_close.index + cursor;
    }

    public is_nested_template(): boolean {
        if (this.match_open_index == -1) {
            return false;
        }
        if (this.match_close_index == -1) {
            return true;
        }

        return this.match_open_index < this.match_close_index;
    }

    public is_closed_template(): boolean {
        if (this.match_close_index == -1) {
            return false;
        }
        if (this.match_open_index == -1) {
            return true;
        }

        return this.match_close_index < this.match_open_index;
    }

    public is_invalid(): boolean {
        return this.match_close_index == -1;
    }
}

export class ITempTemplate {
    constructor(public from: number,
                public to: number,
                public header: string,
                public body: Array<ITempTemplate | string>) {

    }

    // TODO! Maybe separate the exported functions/css prefix into another class
    // to not pass the entire plugin
    private process_template(header: string, 
                             content: string, 
                             plugin: ITempPlugin): string {
        if (header.length == 0)
            return content;
        
        if (header.charAt(0) == ".") {
            header = header.substring(1);
            return `<span class="${plugin.settings.css_prefix}${header}">${content}</span>`;
        } else if (('A' <= header.charAt(0) && header.charAt(0) <= 'Z') || header.charAt(0) == '#') {
            return `<span style="color: ${header}">${content}</span>`;
        } else if ('a' <= header.charAt(0) && header.charAt(0) <= 'z') {
            let transf = plugin.exported_functions[header];

            if (typeof transf == "function")
                return transf(content);
        }

        return content;
    }

    private process_template_preview(header: string,
                                     content: string,
                                     plugin: ITempPlugin) {
        if (header.length == 0)
            return content;
    
        if (header.charAt(0) == ".") {
            header = header.substring(1);
            return `<span class="${plugin.settings.css_prefix}${header}">${content}</span>`;
        } else if (('A' <= header.charAt(0) && header.charAt(0) <= 'Z') || header.charAt(0) == '#') {
            return `<span style="color: ${header}">${content}</span>`;
        } else {
            return `<span style="color: #a1d1ce">${content}</span>`;
        }
    }

    escape_text(str: string, should_escape: boolean): string {
        if (should_escape)
            return str.replace(/</g, "&gt;")
                .replace(/>/g, "&lt;");
        return str;
    }

    expand(escape_text: boolean, plugin: ITempPlugin) {
        let result = "";

        for (let i = 0; i < this.body.length; i++) {
            const son = this.body[i];

            if (typeof son == "string")
                result = result + son;
            else
                result = result + son.expand(escape_text, plugin);
        }
        
        return this.process_template(this.header, result, plugin);
    }


    expand_preview(escape_text: boolean, cursor: number, plugin: ITempPlugin) {
        let result = "";

        for (let i = 0; i < this.body.length; i++) {
            const son = this.body[i];

            if (typeof son == "string")
                result = result + son;
            else
                result = result + son.expand_preview(escape_text, cursor, plugin);
        }

        return this.process_template_preview(this.header, result, plugin);
    }

    collect_templates(result: Array<ITempTemplate>, cursor: readonly SelectionRange[]) {
        let intersects = false;

        for (let i = 0; i < cursor.length; i++)
            if (!(cursor[i].to <= this.from || this.to <= cursor[i].from))
                intersects = true;

        if (intersects) {
            for (let i = 0; i < this.body.length; i++) {
                if (typeof this.body[i] != "string") {
                    const son = this.body[i] as ITempTemplate;
                    son.collect_templates(result, cursor);
                }
            }
        } else {
            result.push(this);
        }
    }
}

export class ITempParser {
    private cursor: number;
    private open_brace_regex: RegExp;
    private close_brace_regex: RegExp;
    private esc_open_brace_regex: RegExp;
    private esc_close_brace_regex: RegExp;
    private template_size: number;

    constructor(private str: string, 
                private external_offset: number, 
                htmlmode: boolean = true,) {
        if (htmlmode) {
            this.open_brace_regex = RegExp("&lt;\\\.[^!]");
            this.close_brace_regex = RegExp("[^!]\\\.&gt;");
            this.esc_open_brace_regex = RegExp("&lt;\\\.!");
            this.esc_close_brace_regex = RegExp("!\\\.&gt;");
            this.template_size = 5;
        } else {
            this.open_brace_regex = RegExp("<\\\.[^!]");
            this.close_brace_regex = RegExp("[^!]\\\.>");
            this.esc_open_brace_regex = RegExp("<\\\.!");
            this.esc_close_brace_regex = RegExp("!\\\.>"); 
            this.template_size = 2;
        }

        this.cursor = 0;
    }

    private is_cursor_valid(): boolean {
        const chr = this.str.charAt(this.cursor);
        return ('a' <= chr && chr <= 'z') ||
            ('A' <= chr && chr <= 'Z') ||
            ('0' <= chr && chr <= '9') ||
            chr == '.' ||
            chr == '_' ||
            chr == '-' ||
            chr == '#';
    }

    parse_template(): ITempTemplate {
        const start_template = this.cursor;
        let sons = new Array<ITempTemplate | string>();

        this.cursor += this.template_size;
        let start_header_pos = this.cursor;

        while (this.is_cursor_valid()) {
            this.cursor++;
        }
        
        let header = this.str.substring(start_header_pos, this.cursor);
        this.cursor++;

        let match: ITempMatch = new ITempMatch(this.str, this.cursor, this.open_brace_regex, this.close_brace_regex);

        while (!match.is_invalid() && !match.is_closed_template()) {
            if (match.is_nested_template()) {
                let pos = match.match_open_index;
                sons.push(this.str.substring(this.cursor, pos));
                this.cursor = pos;
                sons.push(this.parse_template());
            }

            match = new ITempMatch(this.str, this.cursor, this.open_brace_regex, this.close_brace_regex);
        }

        if (match.is_invalid()) {
            // We have an open brace without a closing one
            sons.push(this.str.substring(this.cursor));
            this.cursor = this.str.length + 1;
        } else {
            let pos = match.match_close_index;
            sons.push(this.str.substring(this.cursor, pos));
            this.cursor = pos + this.template_size + 1;
        }
    
        return new ITempTemplate(start_template + this.external_offset,
            this.cursor + this.external_offset, 
            header,
            sons);
    }

    parse_line(): Array<ITempTemplate | string> {
        let parts = new Array<ITempTemplate | string>();
        let match;

        while ((match = this.open_brace_regex.exec(this.str.substring(this.cursor))) !== null) {
            let start_pos = match.index + this.cursor;
            parts.push(this.str.substring(this.cursor, start_pos));
            this.cursor = start_pos;
            parts.push(this.parse_template());
        }

        if (this.cursor < this.str.length)
            parts.push(this.str.substr(this.cursor));

        return parts;
    }
    
    get_nearest_match(content: string): number {
        let match_open = this.esc_open_brace_regex.exec(content);
        let match_close = this.esc_close_brace_regex.exec(content);

        if (match_open === null && match_close === null)
            return -1;
        else if (match_open !== null && match_close === null)
            return match_open.index;
        else if (match_close !== null && match_open === null)
            return match_close.index;
        else if (match_close !== null && match_open !== null)
            return Math.min(match_open.index, match_close.index);
        return -1;
    }
}
