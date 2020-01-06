import * as vscode from 'vscode';

const BACKGROUND_COLOR_FLASHED = 'rgba(255,20,147,1.0)';
const TEXT_COLOR_FLASHED = 'rgba(255,255,255,1.0)';

export class Config {
    private getConfiguration = vscode.workspace.getConfiguration;
    private section: string = 'sonicpi';

    public flashBackgroundColor(): string {
        return this.getConfiguration(this.section).get('flashBackgroundColor', BACKGROUND_COLOR_FLASHED);
    }
    public flashTextColor(): string {
        return this.getConfiguration(this.section).get('flashTextColor', TEXT_COLOR_FLASHED);
    }
}
