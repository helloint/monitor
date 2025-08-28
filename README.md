# Monitor 数据文件监控记录器
## 数据仓库
数据仓库和Monitor是分离的。主要是为了绕过GitHub Action的收费策略。
Monitor设计成Public，所以Action的执行不计费。数据仓库设计成private，监控和存储的内容可以做到保密。

使用时，需要自己配置一个数据仓库，建议取名：`monitor-data`。
只需要在根目录下创建监控配置文件`config.json`，格式请参考`./config.json`和`##配置说明`。
数据文件会保存在数据仓库`./data`目录下。

## 定时的说明
可以用GitHub Action的schedule:
```yaml
schedule:
    - cron: '*/1 * * * *'
```

但GitHub Action的schedule, 它的时间间隙是无法保证的, 有时候甚至一小时才会触发一次.

对于定时的准确度，如果要求高，就不要用schedule. 可以改用其他定时器通过workflow_dispatch的方式来触发Action.

比如Linux的cron, sample:
```shell
*/1 * * * * root curl 'https://api.github.com/repos/[YOUR_ORG]/[YOUR_REPO]/actions/workflows/detect.yml/dispatches' -H 'authorization: Bearer [GITHUB_PAT]' -d '{"ref":"master"}'
```

## 定时轮询数据文件. 仅当文件内容发生改变时, 保存一份下来.

```json
{
	"id": "simple_get",
	"url": "https://dummyjson.com/test"
}
```

## 当文件内容符合特定条件时, 发送消息通知 (目前只支持群晖Synology Chat)
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

## 配置说明
| Configuration   | Instruction         | Default | Required |
|-----------------|---------------------|---------|----------|
| id              | 任务的唯一标识             |         | Yes      |
| url             | 需要轮询的数据文件地址         |         | Yes      |
| options         | fetch的options       |         | No       |
| every           | 每隔几分钟执行一次，默认每次执行    | 1       | No       |
| random          | 执行时间是否加入随机Delay     | No      | No       |
| enable          | 是否启用                | Yes     | No       |
| format          | 保存时是否格式化            | No      | No       |
| filters         | 文件差异比较时，需要忽略的属性     |         | No       |
| condition       | 文件差异比较时，需满足的额外条件    |         | No       |
| notify          | 是否启用通知              | No      | No       |
| notifyCondition | 通知的额外条件             |         | No       |
| errorCondition  | 异常条件，满足时会记录以及发送消息通知 |         | No       |

## Actions参数说明
| Repository secrets | Instruction | Required |
|--------------------|-------------|----------|
| DATA_REPO          | 数据仓库        | Yes      |
| DATA_REPO_PAT      | 访问数据仓库的PAT  | Yes      |
| NOTIFY_SERVER      | 通知服务的请求URL  | No       |
| NOTIFY_TOKEN       | 通知服务的Token  | No       |
