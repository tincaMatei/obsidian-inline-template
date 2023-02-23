# Inline Template Obsidian plugin

Ever wondered how to insert colored text into your notes? You can do that with spans.

But what if you didn't want to get your notes too cluttered with spans? What if you wanted to 
do other modifications on your text? What if you wanted to do some other cool transformations 
to your text?

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

Syntax highlighting is also somewhat supported in Live Preview mode.

## JavaScript

This plugin runs external JavaScript code. That means that you should not use untested 
JavaScript code from the internet that you don't know what it does.

The way this feature works is by setting a javascript file. The locations start from
the root of the vault.

This file should export multiple functions that take a string and return another string.
For instance, the following function will greet the given string:

```js
export function greet(name) {
    return "Hello, " + name + "!";
}
```

Note that JavaScript function templates do not transform the text in Live Preview mode. They
only work in Reading mode.

## Installation

### Manual installation

```
Download the latest release of this repository.
Extract the contents of the release inside a folder.
Put the folder in the .obsidian/plugins directory.
Restart Obsidian.
Activate the plugin.
```

## Other hacks

* You can set a CSS prefix which is going to be automatically appended to the
class names you use. You can use that to avoid having clashes with other classes,
and to avoid having very long names.
* You can nest templates. That means that you can combine them into something even
cooler.

## Features to add in the future

* A way to define even more overpowered templates
* Commands to apply a template to selected text
* Templates to modify the background color of some text.

## Acknowledgements

[Templater](https://github.com/SilentVoid13/Templater) was the biggest inspiration
of this project. I wanted to do what I planned using Templater, but then I realised that
the document will become even more cluttered, so I had to do something. My plugin should
probably work really really well with Templater, but I didn't test it too much.
