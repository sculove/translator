import {
  window as vswindow,
  commands,
  Range,
  workspace,
  QuickPickItem,
} from "vscode";
import { josa } from 'josa'
import { Observable } from "rxjs/Observable";
import { pipe } from "rxjs/Rx";
import { from } from "rxjs/observable/from";
import { filter, map, mergeMap, retry } from "rxjs/operators";
import "rxjs/add/observable/throw";

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
    const apiConfig = config[config.type];
    const hasProperty = !apiConfig || Object.keys(apiConfig).every(v => !!apiConfig[v]);
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

  private googleAPI(text: string, config, isKo): Observable<TranslatorResult> {
    const source = isKo ? "ko" : "en";
    const target = isKo ? "en" : "ko";
    const url = `https://translate.google.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&dt=bd&ie=UTF-8&oe=UTF-8&dj=1&source=icon&q=${encodeURI(text)}`;

    return from(fetch(url))
      .pipe(
        filter((res: Response) => res.ok),
        mergeMap((res: Response) => from(res.json())),
        map(msg => ({
            source,
            target,
            translatedText: msg.sentences.map(v => v.trans).join("")
          })
        ),
      );
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
      body: Object.keys(body).map(v => `${v}=${encodeURI(body[v])}`).join("&"),
    }))
    .pipe(
        filter((res: Response) => res.ok),
        mergeMap((res: Response) => from(res.json())),
        map(msg => {
          const result = msg.message.result;
          return {
            source: result.srcLangType,
            target: result.tarLangType,
            translatedText: result.translatedText
          };
        }),
    );
  }
}