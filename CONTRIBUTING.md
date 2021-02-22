# Contribution Guide

## 개발 환경을 설정합니다

### 의존성 설치

프로젝트 루트에서 다음 명령어를 입력해 의존성을 설치합니다

```bash
$ yarn
```

> Karrotframe은 [Yarn 2](https://yarnpkg.com)와 Yarn workspace를 사용합니다

### Karrotframe 빌드하기

`/packages/karrotframe` 폴더에서 다음 명령어로 빌드합니다

```bash
$ yarn build
```

### Example 프로젝트 시작하기

`/examples/playground` 폴더에서 다음 명령어로 Example 프로젝트를 시작할 수 있습니다

```bash
$ yarn start
```

### Karrotframe을 수정하면서 Example 프로젝트의 변화를 봅니다

```bash
# /examples/playground
$ yarn start

# 새 터미널 창의 /packages/karrotframe
$ yarn build:runtime --watch
```
