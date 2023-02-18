# Inline Template Obsidian plugin

Ever wondered how to insert colored text into your notes? You can do that with spans.

But what if you didn't want to get your notes too cluttered with spans? What if you wanted to 
do other modifications on your text?

With this plugin, now you can.

You can use inline templates that will be rendered in Reading Mode.

## Features

This plugin adds three ways to modify text.

| Inline Template | Replaced with |
| --- | --- |
| <.RED Simple colored template .> | `<span style="color:red">Simple colored template</span>` |
| <..class Custom class template .> | `<span class="class">Custom class template</span>` |
| <.func Function template .> | `func("Function template")` |

The first option is good if you just want to color some text.

The second option works best if you have some css snippets and you want to apply
them to some piece of text.

The third option takes a JavaScript function from a configurable location in the root of 
the vault. This works great if you want to generate some even cooler text.

The templates can also be nested. That is, you can have a template inside another template.

## Warning

This plugin is unsafe at the moment. You can run any type of JavaScript code without any error
catching. You can turn off this option in the settings, and by default, it is turned off.

## Installation

### Manual installation

```
Download the contents of the repository.
Extract the contents of the repository in a folder.
Put the folder in the .obsidian/plugins directory.
Restart Obsidian.
Activate the plugin.
```

## Other hacks

* This plugin may not work well with the traditional way to link to another 
note, so the best way to do it would be: `[<.RED link .>](Link location)`.
* You can set a CSS prefix which is going to be automatically appended to the
class names you use. You can use that to avoid having clashes with other classes,
and to avoid having very long names.

## Features to add in the future

* Syntax highlighting
* Clearing cache whenever entering reading mode
* Command to reload the JS scripts

## Acknowledgements

[Templater](https://github.com/SilentVoid13/Templater) was the biggest inspiration
of this project. I wanted to do what I planned using Templater, but then I realised that
the document will become even more cluttered, so I had to do something. My plugin should
probably work really really well with Templater, but I didn't test it too much.
