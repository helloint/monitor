# Monitor: Data File Monitoring & Logger

## Introduction
This tool adopts a model that separates the program (Monitor) from the data (Data). It was initially designed to bypass GitHub Action's pricing strategy while also meeting the confidentiality requirements for monitoring content and data storage.

## Monitor
Monitor is public, so Action executions are not billed.

Several parameters need to be configured in Monitor's Action Secrets to obtain read and write permissions for the data repository. For details, please refer to the [Actions Parameter Description](#actions-parameter-description).

## Data Repository
The data repository must be created separately. When using it, you need to configure your own data repository. It is recommended to name it `monitor-data`, which can be set to either private or public.

Simply create a monitoring configuration file `config.json` in the root directory. For the format, please refer to `./config.json` and the [Full Parameter Description](#full-parameter-description).
Data files will be saved in the `/data` directory.

## Timing Explanation
GitHub Action's schedule can be used:
```yaml
schedule:
    - cron: '*/1 * * * *'
```

However, its polling interval is not guaranteed. Sometimes it may even trigger only once an hour. Therefore, if high timing accuracy is required, avoid using the schedule. Instead, use other timers to trigger the Action via the `workflow_dispatch` method.

For example, Linux's cron:
```shell
*/1 * * * * root curl 'https://api.github.com/repos/[YOUR_ORG]/[YOUR_REPO]/actions/workflows/detect.yml/dispatches' -H 'authorization: Bearer [GITHUB_PAT]' -d '{"ref":"master"}'
```

## Configuration Examples

### Periodically poll data files. Save a copy only when the file content changes.
```json
{
	"id": "simple_get",
	"url": "https://dummyjson.com/test"
}
```

### Send a notification when the file content meets specific conditions (currently only supports Synology Chat).
```json
{
	"id": "livescore",
	"url": "https://match.uefa.com/v5/livescore?matchId=2036177",
	"format": true,
	"filters": [
		"hash",
		"minute"
	],
	"condition": "length",
	"notify": true,
	"notifyCondition": "length > 0"
}
```

## Full Parameter Description
| Configuration   | Instruction                                              | Default | Required |
|-----------------|----------------------------------------------------------|---------|----------|
| id              | Unique identifier for the task                           |         | Yes      |
| url             | URL of the data file to poll                             |         | Yes      |
| options         | Fetch options                                            |         | No       |
| every           | Execution interval in minutes (default: every execution) | 1       | No       |
| random          | Whether to add random delay to execution time            | No      | No       |
| enable          | Whether to enable the task                               | Yes     | No       |
| record          | Whether to save the data                                 | Yes     | No       |
| filters         | Properties to ignore during file comparison              |         | No       |
| condition       | Additional conditions for file comparison                |         | No       |
| format          | Whether to format the saved data                         | No      | No       |
| notify          | Whether to enable notifications                          | No      | No       |
| notifyCondition | Additional conditions for notifications                  |         | No       |
| errorCondition  | Error conditions that trigger logging and notifications  |         | No       |

## Actions Parameter Description
| Repository Secrets | Instruction                              | Required |
|--------------------|------------------------------------------|----------|
| DATA_REPO          | Data repository                          | Yes      |
| DATA_REPO_PAT      | PAT to access the data repository        | Yes      |
| NOTIFY_SERVER      | Request URL for the notification service | No       |
| NOTIFY_TOKEN       | Token for the notification service       | No       |
