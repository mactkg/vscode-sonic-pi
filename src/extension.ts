'use strict';
import { window, commands, ExtensionContext } from 'vscode';
import * as OSC from 'osc-js';

export function activate(context: ExtensionContext) {
    let sonicPi = new SonicPi();

    let runCodeCmd = commands.registerCommand('extension.runCode', () => {
        sonicPi.runCode();
    });

    let stopAllCmd = commands.registerCommand('extension.stopAll', () => {
        sonicPi.stopAllCode();
    });

    context.subscriptions.push(runCodeCmd);
    context.subscriptions.push(stopAllCmd);
    context.subscriptions.push(sonicPi);
}

export function deactivate() {
}

class SonicPi {

    GUI_ID: number = 10;
    osc: any;

    constructor() {
        this.osc = new OSC({ 
            plugin: new OSC.DatagramPlugin({ send: { port: 4557 } }) 
        });
        this.osc.open({ port: 4558 });
    }

    public runCode() {
        let code = this.getCurrentCode();
        if(!code) {
            return;
        }

        const msg = new OSC.Message('/run-code', this.GUI_ID, code);
        this.osc.send(msg);
    }

    public stopAllCode() {
        const msg = new OSC.Message('/stop-all-jobs', this.GUI_ID);
        this.osc.send(msg); 
    }

    public getCurrentCode(): String | undefined {
        let editor = window.activeTextEditor;
        if(!editor) {
            return;
        }
        return editor.document.getText();
    }

    dispose() {
        this.osc.close()        
    }
}