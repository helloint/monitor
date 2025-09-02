import fs from 'fs';
import os from 'os';
import {areJsonEqual, executeWithDelay, getCurrentDateTimeStringPath, readDataFile, writeDataFile} from "./utils.js";

const args = process.argv.slice(2);
const DATA_ROOT = args.length > 0 ? (!args[0].endsWith('/') ? args[0] + '/' : args[0]) : './';

let hasNewFile = false;
let needsNotify = false;
const data = [];

const main = async (isRandom) => {
	console.log(`main(random:${!!isRandom}) start`);
	const minutes = new Date().getHours() * 60 + new Date().getMinutes();
	const configs = readDataFile(`${DATA_ROOT}config.json`);
	for (const {id, url, options, format, filters, condition, notify, notifyCondition, errorCondition, every = 1, random, record = true, enable} of configs) {
		if (enable === false || minutes % every !== 0 || !!isRandom !== !!random) {
			console.log(`monitor id: ${id} skipped`);
			continue;
		}

		console.log(`monitor id: ${id} start`);
		const processedOptions = processOptions(options);
		try {
			const result = await monitorFile(id, url, processedOptions, format, filters, condition);
			if (result && record) {
				hasNewFile = true;
				if (notify || notifyCondition) {
					if (!notifyCondition || eval(`result.${notifyCondition}`)) {
						const msg = `id: ${id} content changed, condition: ${notifyCondition || true} match`;
						console.log(msg);
						data.push(msg);
						needsNotify = true;
					}
				}

				if (errorCondition && eval(`result.${errorCondition}`)) {
					const msg = `id: ${id} errors, condition: ${errorCondition} match`;
					console.log(msg);
					data.push(msg);
					needsNotify = true;
				}
			}
		} catch (e) {
			console.error('There was a problem with your fetch operation:', e);
			data.push(e.toString());
			needsNotify = true;
		}
		console.log(`monitor id: ${id} end`);
	}

	if (hasNewFile) {
		setOutput('new_file', true);
	}

	console.log(`main(random:${!!isRandom}) end`);
}

/**
 * 比较新数据和老数据, 仅当条件满足且内容变化时, 才保存新数据.
 * @param id 需要存储的目录名
 * @param url 需要匹配的目标URL
 * @param options fetch options
 * @param format 是否对JSON格式化, 方便查看.
 * @param filters 字符串数组类型, 过滤特定字段. 比如设置`['referees']`, 过滤掉你不关心的`referees`字段.
 * @param condition 需满足的额外条件. 比如设置`length`, 则即便内容有变化, 也还需要length变化时, 才存储.
 * @returns {Promise<any|null>}
 */
const monitorFile = async (id, url, options = null, format = false, filters = null, condition = null) => {
	const response = options ? await fetch(url, options) : await fetch(url);
	if (!response.ok) {
		console.error(`There was a problem with your fetch operation. response: ${response.status}`);
	}

	const newData = await getContent(response);
	const folderName = id.replace(/\//g, '_');
	const currentFile = `${DATA_ROOT}data/${folderName}/current.json`;
	const previousData = readDataFile(currentFile, 'utf8');
	if (!areJsonEqual(newData, previousData, filters) && (!condition || (eval(`newData.${condition}`) !== eval(`previousData.${condition}`)))) {
		const timestampPath = getCurrentDateTimeStringPath();
		writeDataFile(currentFile, JSON.stringify(newData, null, format ? '\t' : null));
		writeDataFile(`${DATA_ROOT}data/${folderName}/${timestampPath}`, JSON.stringify(newData, null, format ? '\t' : null));
		return newData;
	}

	return null;
}

const getContent = async (response) => {
	if (response.ok) {
		// 请求成功，返回解析后的JSON数据
		return await response.json();
	} else {
		// 请求失败
		const status = response.status;
		const statusText = response.statusText;

		// 如果是40x错误，尝试获取JSON格式的错误信息
		if (status >= 400 && status < 500) {
			try {
				// 尝试解析错误响应体为JSON
				const errorData = await response.json();
				return { error: statusText, details: errorData, status };
			} catch (e) {
				// 如果解析JSON失败，尝试获取文本内容
				try {
					const errorText = await response.text();
					return { error: statusText, details: errorText, status };
				} catch (textError) {
					return { error: statusText, details: '无法读取响应内容', status };
				}
			}
		} else {
			// 对于非40x错误，不尝试获取响应内容
			return { error: statusText, status };
		}
	}
}

const setOutput = (key, value) => {
	try {
		const output = process.env['GITHUB_OUTPUT']
		fs.appendFileSync(output, `${key}=${JSON.stringify(value)}${os.EOL}`)
	} catch (e) {
		console.error('GitHub output failed:', e.message);
	}
}

const processOptions = (options) => {
	if (options && options.headers) {
		const processedHeaders = {...options.headers};
		Object.entries(options.headers).map(([key, value]) => {
			if (value === '{{timestamp}}') {
				processedHeaders[key] = Date.now();
			}
		});

		return {
			...options,
			headers: processedHeaders,
		}
	}

	return options;
}

await main();
await executeWithDelay(main, true);

setOutput('data', data);
setOutput('notify', needsNotify);
