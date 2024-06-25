## Description

- [슬랙 API](https://api.slack.com/)와 [NestJS](https://nestjs.com/)를 이용해 만든 슬랙 변수 네이밍 봇입니다.
- Slash Commands, Interactivity 설정이 완료된 슬랙 API 앱과 연결 후 사용할 수 있습니다.
- 한글을 영어로 번역하는 모듈을 별도로 설치해야 합니다.

## Installation

```bash
$ npm install
```

## Running the app

- 먼저 아래와 같은 .env 파일을 프로젝트 루트에 생성합니다.

```bash
SLACK_API_KEY= # slack api key e.g. xoxb-0123...
SLACK_CHANNEL= # slack channel id e.g. C00...

NODE_ENV= # development or production
DB_HOST= # e.g. localhost
DB_PORT= # e.g. 5432
DB_USER= # database username
DB_PASS= # database password
DB_NAME= # database name

ANALYZER_HOST= # http://...
```

- 아래 명령어를 이용해 서버를 실행합니다.

```bash
# development
$ npm run start:dev

# production mode
$ npm run build && npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## License

MIT licensed
