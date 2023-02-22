import ITempPlugin from "./main";
import { ITempTemplate, ITempParser } from "./parser"
import { StreamLanguage, syntaxTree } from "@codemirror/language"
import {setIcon} from "obsidian";
import {EditorView, Decoration, DecorationSet, PluginValue, ViewUpdate} from "@codemirror/view"
import {StateField, StateEffect, RangeSetBuilder, Extension, Transaction} from "@codemirror/state"
import {keymap, PluginSpec, ViewPlugin} from "@codemirror/view"

import {WidgetType} from "@codemirror/view";

let global_plugin: ITempPlugin;

export class ITempTemplateWidget extends WidgetType {
    constructor(private tree: ITempTemplate) {
        super()
    }

    toDOM(view: EditorView): HTMLElement {
        const div = document.createElement("span");
        div.innerHTML = this.tree.expand_preview(true, 0, global_plugin);
        return div;
    }
}

class ITempTemplatePlugin implements PluginValue {
    decorations: DecorationSet;
  
    constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
    }
  
    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || update.selectionSet) {
            this.decorations = this.buildDecorations(update.view);
        }
    }
  
    destroy() {}
  
    buildDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();

        for (let { from, to } of view.visibleRanges) {
            const line = view.state.doc.sliceString(from, to);
            const selections = view.state.selection.ranges;

            let parser = new ITempParser(line,
                from,
                false
            );

            let tree = parser.parse_line();
            let relevant_trees = new Array<ITempTemplate>();

            for (let i = 0; i < tree.length; i++) {
                if (typeof tree[i] != "string") {
                    const son = tree[i] as ITempTemplate;
                    son.collect_templates(relevant_trees, selections);
                }
            }

            for (let i = 0; i < relevant_trees.length; i++) {
                const son = relevant_trees[i];
                builder.add(son.from, son.to,
                    Decoration.replace({
                        widget: new ITempTemplateWidget(son)
                    }));
            }
        }
    
        return builder.finish();
    }
}
  
const pluginSpec: PluginSpec<ITempTemplatePlugin> = {
    decorations: (value: ITempTemplatePlugin) => value.decorations,
};
  
export const itempTemplatePlugin = ViewPlugin.fromClass(
    ITempTemplatePlugin,
    pluginSpec
);

export class ITempSyntaxHighlighter {
    constructor(private plugin: ITempPlugin) {
        this.setup();
    }

    setup() {
        global_plugin = this.plugin;
        this.plugin.registerEditorExtension(itempTemplatePlugin);
    }
}
