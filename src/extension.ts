'use strict';
import "isomorphic-fetch";
import {
    window as vswindow,
    commands,
    ExtensionContext,
    Range,
    QuickPickItem,
    Selection,
} from "vscode";
import { Observable } from "rxjs/Observable";
import { pipe } from "rxjs/Rx";
import { from } from "rxjs/observable/from";
import { filter, map, mergeMap } from "rxjs/operators";
import { Translator, TranslatorResult } from "./translator";

export function activate(context: ExtensionContext) {
    const disposable = commands.registerCommand('extension.translateForKorean', () => {
        const translator = new Translator();
        const editor = vswindow.activeTextEditor;
        if (!editor) {
            vswindow.showInformationMessage('Open a file first to manipulate text selections');
            return;
        }
        const selections = editor.selections;
        const range = new Range(selections[0].start, selections[selections.length - 1].end);
        const text = editor.document.getText(range) || ""
        
        text && translator.get(text)
            .subscribe((v: TranslatorResult) => {
                vswindow.showQuickPick(v.itemList, {
                    matchOnDescription: true,
                    placeHolder: "변경하고 싶은 단어.문장을 고르세요"
                }).then((item: QuickPickItem) => {
                    item && editor.edit(edit => edit.replace(range, item.label));
                });
            }, err => vswindow.showErrorMessage(err));
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}