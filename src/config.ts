import * as vscode from 'vscode';

export class Config {
    readonly getConfiguration = vscode.workspace.getConfiguration;
    readonly configSection: string = 'sonicpi';

    public flashBackgroundColor(): string {
        return this.getConfiguration(this.configSection).get('flashBackgroundColor', 'rgba(255,20,147,1.0)');
    }
    public flashTextColor(): string {
        return this.getConfiguration(this.configSection).get('flashTextColor', 'rgba(255,255,255,1.0)');
    }
}