# translator

A vscode plugin for Koreans that can help you write classes, variables, and function names.  
클래스, 변수 및 함수 이름을 작성할 때 한국사용자에게 도움을 주는 vscode 플러그인이다.

## Features
- Translates English(Korean) into Korean(English)  
  영어(한국어)를 한국어(영어)로 번역합니다.
  ![enToKor](https://github.com/sculove/translator/raw/master/images/enToKor.gif)
- Provides a method name with a prefix that can be applied to the translated text when you translate Korean.  
  한국어를 번역 할 때, 번역 된 텍스트에 적용 할 수 있는 접두사가 있는 메서드 이름을 제공합니다.
  ![korToEn](https://github.com/sculove/translator/raw/master/images/korToEn.gif)

> ### Shortcuts
> - MacOS: `Cmd + Alt + 1`
> - Window: `Ctrl + Alt + 1`


## Requirements

You need NAVER API key. I have a plan that add some other `translate API` next time.  
NAVER API 키가 필요합니다. 향후 다른 `번역 API`도 추가할 예정입니다.


### Naver API
- Free up to 10,000 per day  
  매일 10,000까지 무료
- [NAVER API Registration Guide]((https://github.com/sculove/translator/wiki/Register-NAVER-API))  
  [NAVER API 등록 가이드](https://github.com/sculove/translator/wiki/Register-NAVER-API)


## Extension Settings

* `translator.naver.clientId`: Naver API ClientID
* `translator.naver.clientSecret`: Naver API clientSecret
* `translator.rules`: suggest prefix rules

```js
  // ...
  "translator.naver.clientId": "Naver API clientID",
  "translator.naver.clientSecret": "Naver API clientSecret",
  "translator.rules": [
        {
            "prefix": "create",
            "description": "생성한다",
            "detail": "기존에 없던 것을 창조한다.",
            "antonymPrefix": "destroy"
        },
        {
            "prefix": "make",
            "description": "생성한다 ",
            "detail": "기존에 있던 것에서 부가 자료를 생성한다."
        },
        {
            "prefix": "destroy",
            "description": "파괴한다. 자원을 해제한다.",
            "antonymPrefix": "create"
        }
        // ...
    ]
```


## Release Notes

### 1.0.0

Initial release of Translator.
