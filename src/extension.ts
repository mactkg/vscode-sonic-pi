'use strict';
import { workspace, window, commands, ExtensionContext, Range, TextEditor } from 'vscode';
import { Config } from './config';
import * as OSC from 'osc-js';
import * as ICONV from 'iconv-lite';
import * as HOME_DIR from 'user-home';

export async function activate(context: ExtensionContext) {
    let sonicPi = new SonicPi();
    await sonicPi.initOSC();

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
        this.flashCode(editor);
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

    public async initOSC() {
        const ports = await this.getDynamicPort();
        this.osc = new OSC({
            plugin: new OSC.DatagramPlugin({ send: { port: ports.server_listen_port } })
        });
        this.osc.open({ port: ports.gui_listen_port });
    }

    private flashCode(editor: TextEditor) {
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

    private async getDynamicPort() {
        let ports = { server_listen_port: 4557, gui_listen_port: 4558 };
        const doc = await workspace.openTextDocument(HOME_DIR + '/.sonic-pi/log/gui.log');
        if (!doc) { return ports; }
        const text = doc.getText();
        const server_regex = /Server listen to gui port\s+(\d+)/;
        const server_listen_port = this.extractPortNumber(text, server_regex);
        const gui_regex = /GUI listen to server port\s+(\d+)/;
        const gui_listen_port = this.extractPortNumber(text, gui_regex);
        // both port numbers are always output in boot log.
        if (server_listen_port && gui_listen_port) {
            ports.server_listen_port = server_listen_port;
            ports.gui_listen_port = gui_listen_port;
        }
        return ports;
    }

    private extractPortNumber(text: string, regex: RegExp) {
        const arr = regex.exec(text);
        const port = arr ? arr[1] : '';
        return Number(port);
    }

    dispose() {
        this.osc.close();
    }
}
