import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { ITemp } from './itemp';

// Remember to rename these classes and interfaces!

interface ITempSetting {
	script_file_name: string;
}

const DEFAULT_SETTINGS: ITempSetting = {
	script_file_name: 'default'
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
	}

	onunload() {

	}

	async loadScripts() {
		let file_name: string = this.settings.script_file_name;

		try {
			let path = this.app.vault.adapter.getResourcePath(file_name);
			this.exported_functions = {};

			await import(path)
				.then(obj => { 
					this.exported_functions = obj;
					this.exported_functions["milsugi_si_milbelesti"]();
					console.log(typeof this.exported_functions["milsugi_si_milbelesc"]);
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
			.setName('Script file')
			.setDesc('File where you can put all the useful scripts that you need.')
			.addText(text => {
				text
					.setPlaceholder('Folder name')
					.setValue(this.plugin.settings.script_file_name)
					.onChange(async (value) => {
						console.log('Secret: ' + value);
						this.plugin.settings.script_file_name = value;
						await this.plugin.saveSettings();
					})
			});
	}
}
