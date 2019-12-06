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
  merge_schedule:
    runs-on: ubuntu-latest
    steps:
      - uses: gr2m/merge-schedule-action@v1.x
```

## License

[ISC](LICENSE)
