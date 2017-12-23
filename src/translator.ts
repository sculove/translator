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
import { josa } from 'josa'
import { Observable } from "rxjs/Observable";
import { pipe } from "rxjs/Rx";
import { from } from "rxjs/observable/from";
import { filter, map, mergeMap, retry } from "rxjs/operators";
// import { forkJoin /*_throw*/ } from 'rxjs/observable';
import "rxjs/add/observable/throw";
import "rxjs/add/observable/forkJoin";

export interface TranslatorResult {
  source: string,
  target: string,
  translatedText: string,
  itemList?: QuickPickItem[]
}

export interface TranslatorRule {
  prefix: string,
  description: string,
  antonymPrefix? : string,
  detail?: string
}

export interface TranslatorConfig {
  type: string;
  naver?: {
    clientId: string;
    clientSecret: string;
  },
  rules?: TranslatorRule[];
}

export class Translator {
  public get(text: string): Observable<TranslatorResult> {
    const config = workspace.getConfiguration("translator");
    const hasProperty = Object.keys(config[config.type]).every(v => !!config[config.type][v]);
    
    if (hasProperty) {
      const isKo = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);

      return this[`${config.type}API`](text, config, isKo)
        .pipe(
          map((data: TranslatorResult) => {
          data.itemList = this.getItemList(text, data.translatedText, config, text.split("\n").length > 1 ? false : isKo);
            return data;
          }),
          retry(2)
        );
    } else {
      // return _throw(`${type}의 API 정보를 입력해주세요`);
      return Observable.throw(`${config.type}의 API 정보를 입력해주세요`);
    }
  }
  private getItemList(text: string, translatedText: string, config, isAddPrefixList): QuickPickItem[] {
    const list: QuickPickItem[] = [{
        label: translatedText,
        description: "",
        detail: text,
    }]
    if (isAddPrefixList) {
      const prefixList: QuickPickItem[] = config.rules.map((rule:TranslatorRule): QuickPickItem => {
        const item: QuickPickItem = {
          label: `${rule.prefix}${translatedText}`,
          description: josa(`${text.trim()}#{을} ${rule.description}`),
          detail: rule.detail || "",
        };
        item.detail += rule.antonymPrefix ? `${item.detail ? " " : ""}[반대말] '${rule.antonymPrefix}${translatedText}'` : "";
        return item;
      });
      return list.concat(prefixList);
    } else {
      return list;
    }
  }
  private naverAPI(text: string, config, isKo): Observable<TranslatorResult>  {
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
            translatedText
          };
        }),
    );
  }
}