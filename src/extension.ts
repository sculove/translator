'use strict';
import 'isomorphic-fetch';
import {
    window as vswindow,
    commands,
    ExtensionContext,
    TextDocument,
    Range,
    window,
} from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "translator" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = commands.registerCommand('extension.translateToKor', () => {
        const editor = vswindow.activeTextEditor;
        if (!editor) {
            vswindow.showInformationMessage('Open a file first to manipulate text selections');
            return;
        }
        const selections = editor.selections;
        const doc = editor.document;
        selections.forEach(selection => {
            const text = doc.getText(new Range(selection.start, selection.end));
    
            //@ api를 콜해서. 번역결과를 보여주는 창이 필요.
            const headers = new Headers({
                "Content-Type": "application/x-www-form-urlencoded",
                'X-Naver-Client-Id': "",
                'X-Naver-Client-Secret': ""
            });
    
            console.log("fetch", fetch);
            const param: RequestInit = {
                method: 'GET',
                headers,
                body: {
                    "source": 'ko',
                    "target": 'en',
                    "text": text
                }
            };
            fetch("https://openapi.naver.com/v1/papago/n2mt", param).then(res => {
                console.log(res);
            }).catch(e => {
                console.error(e);
            });
            console.log(text);
        });
        
        vswindow.showInformationMessage('Hello World!');
    });
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}