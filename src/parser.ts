import ITempPlugin from "./main";

const open_brace_regex = RegExp("&lt;\\\.[^!]");
const close_brace_regex = RegExp("[^!]\\\.&gt;");
const esc_open_brace_regex = RegExp("&lt;\\\.!");
const esc_close_brace_regex = RegExp("!\\\.&gt;");

class ITempMatch {
    public match_open_index: number;
    public match_close_index: number;

    constructor(str: string, cursor: number) {
        let match_open = open_brace_regex.exec(str.substring(cursor));
        let match_close = close_brace_regex.exec(str.substring(cursor));
    
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

export class ITempParser {
    private cursor: number;

    constructor(private str: string, private plugin: ITempPlugin) {
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

    process_template(header: string, content: string): string {
        if (header.length == 0)
            return content;
        
        if (header.charAt(0) == ".") {
            header = header.substring(1);
            return `<span class="${this.plugin.settings.css_prefix}${header}">${content}</span>`;
        } else if (('A' <= header.charAt(0) && header.charAt(0) <= 'Z') || header.charAt(0) == '#') {
            return `<span style="color: ${header}">${content}</span>`;
        } else if ('a' <= header.charAt(0) && header.charAt(0) <= 'z') {
            let transf = this.plugin.exported_functions[header];

            if (typeof transf == "function")
                return transf(content);
        }

        return content;
    }

    parse_template(depth=0): string {
        let result = "";
        
        this.cursor += 5;
        let start_header_pos = this.cursor;

        while (this.is_cursor_valid()) {
            this.cursor++;
        }

        let header = this.str.substring(start_header_pos, this.cursor);
        this.cursor++;
        
        let match: ITempMatch = new ITempMatch(this.str, this.cursor);

        while (!match.is_invalid() && !match.is_closed_template()) {
            if (match.is_nested_template()) {
                let pos = match.match_open_index;
                result = result + this.str.substring(this.cursor, pos);
                this.cursor = pos;
                result = result + this.parse_template(depth + 1);
            }

            match = new ITempMatch(this.str, this.cursor);
        }

        if (match.is_invalid()) {
            this.cursor = this.str.length;
            return "";
        } else {
            let pos = match.match_close_index;
            result = result + this.str.substring(this.cursor, pos);
            this.cursor = pos + 6;
        }

        console.log("=".repeat(depth * 2) + `${header} : ${result}`);

        return this.process_template(header, result);
    }

    replace_templates(): string {
        let result = "";
        let match;

        while ((match = open_brace_regex.exec(this.str.substring(this.cursor))) !== null) {
            let start_pos = match.index + this.cursor;
            result = result + this.str.substring(this.cursor, start_pos);
            this.cursor = start_pos;
            result = result + this.parse_template();
        }

        return result + this.str.substring(this.cursor);
    }
    
    get_nearest_match(content: string): number {
        let match_open = esc_open_brace_regex.exec(content);
        let match_close = esc_close_brace_regex.exec(content);

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

    escape_content(content: string): string {
        let result = "";
        let index;

        index = this.get_nearest_match(content);
        while (index != -1) {
            result = result + content.substring(0, index);
            content = content.substring(index);

            if (content.charAt(0) == "!") {
                result = result + content.substring(1, 6);
                content = content.substring(6);
            } else {
                result = result + content.substring(0, 5);
                content = content.substring(6);
            }

            index = this.get_nearest_match(content);
        }

        return result + content;
    }

    process_content(): string {
        let result = this.replace_templates();
        return this.escape_content(result);
    }
}