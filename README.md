# merge-schedule-action

> GitHub Action to merge pull requests on a scheduled day

## Usage

Create `.github/workflows/merge-schedule.yml`

```yml
name: Merge Schedule

on:
  pull_request:
    types:
      - opened
      - edited
      - synchronize
  schedule:
    # https://crontab.guru/every-hour
    - cron: '0 * * * *'

jobs:
  merge_schedule:
    runs-on: ubuntu-latest
    steps:
      - uses: gr2m/merge-schedule-action@v2
        with:
          # Merge method to use. Possible values are merge, squash or
          # rebase. Default is merge.
          merge_method: squash
          # Time zone to use. Default is UTC.
          time_zone: 'America/Los_Angeles'
          # Require all pull request statuses to be successful before
          # merging. Default is `false`.
          require_statuses_success: 'true'
          # Label to apply to the pull request if the merge fails. Default is
          # `automerge-fail`.
          automerge_fail_label: 'merge-schedule-failed'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

In your pull requests, add a line to the end of the pull request description looking like this

```
/schedule 2022-06-08
```

If you need a more precise, timezone-safe setting, you can use an `ISO 8601` date string

```
/schedule 2022-06-08T09:00:00.000Z
```

Or if you want to merge the next time the merge action is scheduled via the cron expressions, you can leave the date empty

```
/schedule
```

Any string that works with the [`new Date()` constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date) will work.

To control at which time of the day you want the pull request to be merged, I recommend adapting the `- cron: ...` setting in the workflow file.

The action sets a pending commit status if the pull request was recognized as being scheduled.

Note that pull requests from forks are ignored for security reasons.

## Bypassing Repository Rules
There may be cases when you need to bypass certain branch protection rules (i.e. when a branch requires PR approvals prior to merging). On those cases, we recommend creating a [Github App](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps) and granting it access. To set that up, do the following:

1. Register a GitHub App and give it `contents:write` and `pull_request:write permissions` and disable webhooks.
2. Install the app in your repository.
3. Use https://github.com/actions/create-github-app-token to create an installation access token for your app.
4. Use that token to authenticate gr2m/merge-schedule-action.
5. Add the app to the "Allow specified actors to bypass required pull requests" setting.

## License

[ISC](LICENSE)
