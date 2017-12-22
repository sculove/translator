'use strict';
import 'isomorphic-fetch';
import {
    window as vswindow,
    commands,
    ExtensionContext,
    TextDocument,
    Range,
    workspace,
    window,
    QuickPickItem,
} from "vscode";
import {Observable} from "rxjs/Observable";
import {pipe} from "rxjs/Rx";
import { from } from "rxjs/observable/from";
import { filter, map, mergeMap } from "rxjs/operators";
import {Translator, TranslatorResult} from "./translator";


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
    const translator = new Translator();
    const disposable = commands.registerCommand('extension.translateToKor', () => {
        const editor = vswindow.activeTextEditor;
        if (!editor) {
            vswindow.showInformationMessage('Open a file first to manipulate text selections');
            return;
        }
        const selections = editor.selections;
        const doc = editor.document;

        selections.forEach(async selection => {
            const text = doc.getText(new Range(selection.start, selection.end));
            if (text) {
                translator.get(text).subscribe((v: TranslatorResult) => {
                    window.showQuickPick(v.itemList, {
                        matchOnDescription: true, 
                        placeHolder: "변경하고 싶은 단어.문장을 고르세요"
                    }).then((item: QuickPickItem) => {
                        if (item) {
                            editor.edit(function (edit) {
                                edit.replace(selection, item.label);
                            })
                        }
                    });
                })
            }
        });
    });


    

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}