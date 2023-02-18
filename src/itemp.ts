import ITempPlugin from "./main";

export class ITemp {
    constructor(private plugin: ITempPlugin) {}

    async setup(): Promise<void> {
        this.plugin.registerMarkdownPostProcessor((el, ctx) => {
            el.innerHTML = this.replace_templates(el.innerHTML);
        });
    }

    valid_character(chr: string): boolean {
        return ('a' <= chr && chr <= 'z') ||
            ('A' <= chr && chr <= 'Z') ||
            ('0' <= chr && chr <= '9') ||
            chr == '_' ||
            chr == '-' ||
            chr == '#';
    }

    parse_match_class_case(match: string): string {
        let i = 6;

        while (this.valid_character(match.charAt(i))) {
            i++;
        }

        let class_name = match.substring(6, i);
        let body = match.substring(i + 1, match.length - 6);

        return `<span class=${this.plugin.settings.css_prefix}${class_name}>${body}</span>`;
    }

    parse_match_constant_case(match: string): string {
        let i = 5;
        
        while (this.valid_character(match.charAt(i))) {
            i++;
        }
        
        let color_name = match.substring(5, i);
        let body = match.substring(i + 1, match.length - 6);
        
        return `<span style="color: ${color_name}">${body}</span>`;
    }

    parse_match_function_case(match: string): string {
        let i = 5;
        
        while (this.valid_character(match.charAt(i))) {
            i++;
        }
        
        let function_name = match.substring(5, i);
        let body = match.substring(i + 1, match.length - 6);
        
        let transform = this.plugin.exported_functions[function_name];
        if (typeof transform == "function") {
            return transform(body);
        }
        return body;
    }

    parse_match(match: string): string {
        if (match.charAt(5) == ".") {
            return this.parse_match_class_case(match);
        } else if (('A' <= match.charAt(5) && match.charAt(5) <= 'Z') || match.charAt(5) == '#') {
            return this.parse_match_constant_case(match);
        } else if ('a' <= match.charAt(5) && match.charAt(5) <= 'z') {
            return this.parse_match_function_case(match);
        } else {
            return match;
        }
    }

    replace_templates(content: string): string {
        const find_template = RegExp('&lt;\\$.*? \\$&gt;', 'g');
        let match;
        let matches = [];
        
        while((match = find_template.exec(content)) !== null) {
            const begin = match.index;
            const end   = find_template.lastIndex;
          
            matches.push({
                "begin": begin,
                "end":   end
            });
        }
        
        for (let i = matches.length - 1; i >= 0; i--) {
            const begin = matches[i].begin;
            const end   = matches[i].end;
            const match = content.substring(begin, end);
          
            content = content.substring(0, begin) + this.parse_match(match) + content.substring(end);
        }
        
        return content;
    }
}