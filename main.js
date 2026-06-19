const { Plugin, Notice, PluginSettingTab, Setting, setIcon } = require("obsidian");

const DEFAULT_SETTINGS = {
    speed: 0.0003
};

module.exports = class GraphSpinnerPlugin extends Plugin {

    async onload() {
    await this.loadSettings();
    this.addSettingTab(new GraphSpinnerSettingTab(this.app, this));

    new Notice("Graph Spinner loaded!");

    this.animating = false; 
    this.rafId = null;

    const ribbonEl = this.addRibbonIcon("circle", "Toggle Graph Spinner", () => {
        
        // Toggle the animation state
        this.animating = !this.animating;

        if (this.animating) {
            new Notice("Graph spinning activated!");
            
            // spinning state
            setIcon(ribbonEl, "sparkle");

            if (!this.rafId) {
                this.rafId = requestAnimationFrame(this.tick);
            }
        } else {
            new Notice("Graph spinning paused.");
            
            // paused state
            setIcon(ribbonEl, "component");

            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        }
    });

    // The animation loop remains exactly the same
    this.tick = () => {
        if (!this.animating) return;

        const graphLeaves = this.app.workspace.getLeavesOfType("graph");

        if (graphLeaves.length > 0) {
            const renderer = graphLeaves[0].view && graphLeaves[0].view.renderer;

            if (renderer) {
                const nodes = renderer.nodes;

                if (nodes && nodes.length > 0) {
					if (!this.lastNodeCount || this.lastNodeCount !== nodes.length) {
    this.lastNodeCount = nodes.length;
}
                    let cx = 0;
                    let cy = 0;

                    for (let n of nodes) {
                        cx += n.x;
                        cy += n.y;
                    }
                    cx /= nodes.length;
                    cy /= nodes.length;

                    const angleDelta = this.settings.speed;
                    const cos = Math.cos(angleDelta);
                    const sin = Math.sin(angleDelta);

                    for (let i = 0; i < nodes.length; i++) {
                        const ox = nodes[i].x - cx;
                        const oy = nodes[i].y - cy;

                        nodes[i].x = cx + (ox * cos - oy * sin);
                        nodes[i].y = cy + (ox * sin + oy * cos);
                    }

                    renderer.changed();
                }
            }
        }

        this.rafId = requestAnimationFrame(this.tick);
    };
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
