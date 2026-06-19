const { Plugin, Notice, PluginSettingTab, Setting } = require("obsidian");

const DEFAULT_SETTINGS = {
    speed: 0.0003
};

module.exports = class GraphSpinnerPlugin extends Plugin {

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new GraphSpinnerSettingTab(this.app, this));

        new Notice("Graph Spinner loaded!");

        this.angle = 0;
        this.animating = true;

        const tick = () => {
            if (!this.animating) return;

            const graphLeaves =
                this.app.workspace.getLeavesOfType("graph");

            if (graphLeaves.length > 0) {
                const renderer =
                    graphLeaves[0].view && graphLeaves[0].view.renderer;

                if (renderer) {
                    const nodes = renderer.nodes;

                    if (nodes && nodes.length > 0) {

                        if (!this.originalPositions || this.originalPositions.length !== nodes.length) {
                            this.angle = 0;
                            this.originalPositions = nodes.map(n => ({ x: n.x, y: n.y }));
                        }

                        let cx = 0;
                        let cy = 0;

                        for (let n of nodes) {
                            cx += n.x;
                            cy += n.y;
                        }

                        cx /= nodes.length;
                        cy /= nodes.length;

                        this.angle += this.settings.speed;

                        for (let i = 0; i < nodes.length; i++) {
                            const ox = this.originalPositions[i].x - cx;
                            const oy = this.originalPositions[i].y - cy;

                            nodes[i].x = cx + ox * Math.cos(this.angle) - oy * Math.sin(this.angle);
                            nodes[i].y = cy + ox * Math.sin(this.angle) + oy * Math.cos(this.angle);
                        }

                        renderer.changed();
                    }
                }
            }

            this.rafId = requestAnimationFrame(tick);
        };

        this.rafId = requestAnimationFrame(tick);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    onunload() {
        this.animating = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        console.log("Graph Spinner unloaded!");
    }
};

class GraphSpinnerSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h2", { text: "Graph Spinner Settings" });

        new Setting(containerEl)
            .setName("Rotation speed")
            .setDesc("How fast the graph rotates. Lower is slower and more calming.")
            .addSlider(slider => slider
                .setLimits(0.0001, 0.002, 0.0001)
                .setValue(this.plugin.settings.speed)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.speed = value;
                    await this.plugin.saveSettings();
                })
            );
    }
}