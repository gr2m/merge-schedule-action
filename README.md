# 🚧 THIS IS WORK IN PROGRESS! See [#1](https://github.com/gr2m/merge-schedule-action/pull/1)

# merge-schedule-action

> GitHub Action to merge pull requests on a scheduled day

## Usage

```yml
Name: Merge Schedule
on:
  push:
    pull_request:
      - types:
          - opened
          - edited
  schedule:
    # https://crontab.guru/every-hour
    - cron: 0 * * * *

jobs:
  set_status:
    runs-on: ubuntu-latest
    if: github.event_name === "pull_request"
    steps:
      - uses: gr2m/merge-schedule-action/set_status@v1.x
  merge:
    runs-on: ubuntu-latest
    if: github.event_name === "schedule"
    steps:
      - uses: gr2m/merge-schedule-action/merge@v1.x
```

## License

[ISC](LICENSE)
