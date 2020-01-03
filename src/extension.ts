'use strict';
import { window, commands, ExtensionContext, Range, TextEditor } from 'vscode';
import { Config } from './config';
import * as OSC from 'osc-js';
import * as ICONV from 'iconv-lite';

export function activate(context: ExtensionContext) {
    let sonicPi = new SonicPi();

    let runCodeCmd = commands.registerCommand('extension.runCode', () => {
        sonicPi.runCode();
    });

    let stopAllCmd = commands.registerCommand('extension.stopAll', () => {
        sonicPi.stopAllCode();
    });

    let restartCmd = commands.registerCommand('extension.restart', () => {
        sonicPi.stopAllCode();
        setTimeout(() => {
            sonicPi.runCode();
        }, 500);
    });

    context.subscriptions.push(runCodeCmd);
    context.subscriptions.push(stopAllCmd);
    context.subscriptions.push(restartCmd);
    context.subscriptions.push(sonicPi);
}

export function deactivate() {
}

class SonicPi {

    GUI_ID: number = 10;
    osc: any;
    config: any;


    constructor() {
        this.config = new Config();
        this.osc = new OSC({
            plugin: new OSC.DatagramPlugin({ send: { port: 4557 } })
        });
        this.osc.open({ port: 4558 });
    }

    public runCode() {
        let editor = window.activeTextEditor;
        if (!editor) {
            return;
        }
        let code = this.getCurrentCode(editor);
        if (!code) {
            return;
        }
        this.codeFlash(editor);
        const msg = new OSC.Message('/run-code', this.GUI_ID, code);
        this.osc.send(msg);
    }

    public stopAllCode() {
        const msg = new OSC.Message('/stop-all-jobs', this.GUI_ID);
        this.osc.send(msg);
    }

    public getCurrentCode(editor: TextEditor): Buffer | undefined {
        return ICONV.encode(editor.document.getText(), "utf-8");
    }
    private codeFlash(editor: TextEditor) {
        let startPos = editor.document.positionAt(0);
        let endPos = editor.document.positionAt(editor.document.getText().length - 1);
        let range = new Range(startPos, endPos);
        const flashDecorationType = window.createTextEditorDecorationType({
            backgroundColor: this.config.flashBackgroundColor(),
            color: this.config.flashTextColor()
        });
        editor.setDecorations(flashDecorationType, [range]);
        setTimeout(function () {
            flashDecorationType.dispose();
        }, 250);
    }
    dispose() {
        this.osc.close();
    }
}
