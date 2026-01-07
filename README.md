# LSP-esphome

Uses `esphome-lang-server` from [esphome-vscode](https://github.com/esphome/esphome-vscode) to provide validation, completion and hover help for ESPHome Yaml configuration files.

### Installation

* Install [ESPHome syntax](https://packagecontrol.io/packages/ESPHome)
* Install [LSP](https://packagecontrol.io/packages/LSP) and `LSP-esphome` from Package Control.
* Restart Sublime.

### Usage

> [!WARNING]
> 
> For the server to start the file needs to use the `YAML (esphome)` syntax. Set it from the __Command Palette__ or from the syntax selector in the status bar.

Since ESPHome configuration files use the `.yml`/`.yaml` extension and do not differ much from standard YAML files, there is no easy way to automatically assign it to all ESPHome configuration files (unless you want to use this syntax for all YAML files, which could introduce its own problems). Therefore, it is recommended to use the [ApplySyntax](https://packages.sublimetext.io/packages/ApplySyntax) or [AutoSetSyntax](https://packages.sublimetext.io/packages/AutoSetSyntax) package to assign this syntax based on the file path - most likely on a per-project basis since there is nothing inherently unique about the file names or paths of these configuration files.

### Configuration

Open configuration file using __Command Palette__ with `Preferences: LSP-esphome Settings` command or opening it from the Sublime menu (`Preferences > Package Settings > LSP > Servers > LSP-esphome`).

The plugin validates against ESPHome itself, so you will get the same errors. You can connect to ESPHome in two different ways:

1. Use the **ESPHome Device Builder**, this can be the ESPHome running in Home Assistant, in that case you will need to configure the add-on to `leave_front_door_open` and also give a TCP port in the addon for external access (in case you are only accessing via Ingress).

2. Use a **local installation of ESPHome**. By default uses Python environment managed by this package. If you can run esphome in your terminal or have installed esphome in a virtual environment, then you can override `pythonPath` in `initializationOptions` to point at it. In that case it needs point at python executable inside your venv folder or, if Python is in the PATH, the executable name.

Completion and hover help needs to pull schema from https://schema.esphome.io. The schemas are versioned so the extension will first connect to you Device Builder or local ESPHome to retrieve the version you are using and then try to pull the best available matching version.
For the dev version it will pull the schemas dev version daily.
