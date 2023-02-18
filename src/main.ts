import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { ITemp } from './itemp';

// Remember to rename these classes and interfaces!

interface ITempSetting {
	javascript_on: boolean;
	script_file_name: string;
	css_prefix: string;
}

const DEFAULT_SETTINGS: ITempSetting = {
	javascript_on: false,
	script_file_name: 'default',
	css_prefix: '',
}

export default class ITempPlugin extends Plugin {
	settings: ITempSetting;
	exported_functions: any;
	itemp_parser: ITemp;

	async onload() {
		await this.loadSettings();
	
		this.itemp_parser = new ITemp(this);
		this.itemp_parser.setup();

		this.addSettingTab(new ITempSettingTab(this.app, this));

		this.addCommand({
			id: 'inline-template-reload-scripts',
			name: 'Reload scripts',
			callback: () => {
				this.loadScripts();
			}
		});
	}

	onunload() {

	}

	async loadScripts() {
		let file_name: string = this.settings.script_file_name;
		this.exported_functions = {};

		if (!this.settings.javascript_on) {
			return;
		}

		try {
			let path = this.app.vault.adapter.getResourcePath(file_name);

			await import(path)
				.then(obj => { 
					this.exported_functions = obj;
				} )
				.catch(err => { console.error("Failed to load object: ", err)} );
		}
		catch(e) {
			console.error("Failed to load scripts: ", e);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		await this.loadScripts();
	}

	async saveSettings() {
		await this.saveData(this.settings);
		await this.loadScripts();
	}
}

class ITempSettingTab extends PluginSettingTab {
	plugin: ITempPlugin;

	constructor(app: App, plugin: ITempPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Inline Templates Settings'});
		
		new Setting(containerEl)
			.setName('Use JS snippet templates')
			.setDesc('Warning! Turning this on means that you can run external JS code, which is unsafe.')
			.addToggle(cb => {
				cb.setValue(this.plugin.settings.javascript_on)
					.onChange(async (value) => {
						this.plugin.settings.javascript_on = value;
						await this.plugin.saveSettings();
					})
			});

		new Setting(containerEl)
			.setName('Script file')
			.setDesc('The .js file that contains all the used snippets.')
			.addText(text => {
				text
					.setPlaceholder('File name here...')
					.setValue(this.plugin.settings.script_file_name)
					.onChange(async (value) => {
						this.plugin.settings.script_file_name = value;
						await this.plugin.loadScripts();
						await this.plugin.saveSettings();
					})
			});
		
			new Setting(containerEl)
				.setName('CSS class prefix')
				.setDesc('When applying a class to some text, always attach the prefix to the class name to avoid name collisions.')
				.addText(text => {
					text.setPlaceholder('CSS prefix here...')
						.setValue(this.plugin.settings.css_prefix)
						.onChange(async (value) => {
							this.plugin.settings.css_prefix = value;
							await this.plugin.saveSettings();
						})
				})
	}
}
