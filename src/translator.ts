import {
  window as vswindow,
  commands,
  ExtensionContext,
  TextDocument,
  Range,
  workspace,
  window,
  QuickPickItem,
} from 'vscode';
import { josa, getJosaPicker, makeJosaify } from 'josa'
import {Observable} from "rxjs/Observable";
import {pipe} from "rxjs/Rx";
import { from } from "rxjs/observable/from";
import { filter, map, mergeMap, retry } from "rxjs/operators";

export interface TranslatorResult {
  source: string,
  target: string,
  translatedText: string,
  itemList: QuickPickItem[]
}

export interface TranslatrRule {
  prefix: string,
  description: string,
  antonymPrefix? : string,
  detail?: string
}

export class Translator {
  public get(text: string): Observable<TranslatorResult> {
    const config = workspace.getConfiguration("translator");
    console.log(config);
    switch(config.type) {
      default: 
        return this.getNaverAPI(text, config);  
    }
  }
  private getItemList(text: string, translatedText: string, config): QuickPickItem[] {
    const result = [{
        label: translatedText,
        description: text,
        detail: `Convert '${text}' to '${translatedText}'`,
    }]
    return result.concat(config.rules.map((rule:TranslatrRule) => {
      const item = {
        label: `${rule.prefix}${translatedText}`,
        description: josa(`${text.trim()}#{을} ${rule.description}`),
        detail: rule.detail || "",
      };
      item.detail += rule.antonymPrefix ? `${item.detail ? " " : ""}반대말은 '${rule.antonymPrefix}${translatedText}'` : "";
      return item;
    ));
  }
  private getNaverAPI(text: string, config): Observable<TranslatorResult>  {
    const isKo = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text); 
    const body = {
      source: isKo ? "ko" : "en",
      target: isKo ? "en" : "ko",
      text
    };           
    return from(fetch("https://openapi.naver.com/v1/papago/n2mt", {
      method: "POST",
      headers: new Headers({
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          'X-Naver-Client-Id': config.naver.clientId,
          'X-Naver-Client-Secret': config.naver.clientSecret,
      }),
      body: Object.keys(body).map(v => `${v}=${body[v]}`).join("&"),
    }))
    .pipe(
        filter((res: Response) => res.ok),
        mergeMap((res: Response) => from(res.json())),
        map(msg => {
          const result = msg.message.result;
          const translatedText = (/\s/.test(text) ? result.translatedText : result.translatedText.replace(/\s/gi, ""));

          return {
            source: result.srcLangType,
            target: result.tarLangType,
            translatedText,
            itemList: this.getItemList(text, translatedText, config)
          };
        }),
        retry(2)
    );
  }
}