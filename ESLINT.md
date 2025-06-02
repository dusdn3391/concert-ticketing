## ESLint formatter 사용법
1.  새로 추가된 패키지 설치 (yarn 명령어 입력)
2. vscode에서 ctrl + shift + p 눌러서 'settings' 입력해서 제일 위에 있는 파일로 이동
3. 다음과 같은 코드 추가
```json
{
"editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.format.enable": true,
  "eslint.format.enable": true,
  "javascript.format.enable": false,
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    }
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    }
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    }
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    }
  },
}
```
4. 상단 왼쪽 메뉴에 File - Preferences - settings 들어감
5. 검색창에서 'formatter' 검색 후 Editor: Default Formattter를 Prettier - Code formatter 적용

### 이것을 사용하는 이유는 잘못된 문법이나 코드 띄어쓰기, import의 위치 등 파일을 저장만 하면 자동으로 고쳐주기에 사용하면 매우 편리합니다. 
