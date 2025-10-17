import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

// Needed to get __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const writeDataFile = (relativeFilePath, data) => {
	try {
		const filePath = path.join(__dirname, relativeFilePath);

		// Ensure the directory exists
		const dir = path.dirname(filePath);
		fs.mkdirSync(dir, { recursive: true });

		// Write the file
		fs.writeFileSync(filePath, data, 'utf8');

		console.log(`File created successfully, ${filePath}`);
	} catch (error) {
		console.error('Error writing file', error);
	}
};

export const readDataFile = (relativeFilePath) => {
	const filePath = path.join(__dirname, relativeFilePath);

	try {
		const data = fs.readFileSync(filePath, 'utf8');
		try {
			return JSON.parse(data.trim());
		} catch (e) {
			return data.trim();
		}
	} catch (error) {
		// If the file doesn't exist or is empty, return an empty object
		return {};
	}
};

export const getCurrentDateTimeStringPath = () => {
	const now = new Date();

	const year = now.getFullYear().toString();
	const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is zero-based, so add 1
	const day = String(now.getDate()).padStart(2, '0');
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');

	return `${year}/${month}/${day}/${hours}${minutes}`;
}

/**
 *
 * @param json1
 * @param json2
 * @param filterProps string array, props that need to ignore when compare
 * @returns true if equals
 */
export const areJsonEqual = (json1, json2, filterProps = []) => {
	const isObject = obj => obj && typeof obj === 'object';
	const isArray = obj => Array.isArray(obj);

	const filterAndCompare = (obj1, obj2, props) => {
		if (obj1 === obj2) return true;

		if (!isObject(obj1) || !isObject(obj2)) return false;
		if (isArray(obj1) !== isArray(obj2)) return false;

		if (isArray(obj1)) {
			if (obj1.length !== obj2.length) return false;
			for (let i = 0; i < obj1.length; i++) {
				if (!filterAndCompare(obj1[i], obj2[i], props)) return false;
			}
			return true;
		}

		const keys1 = Object.keys(obj1).filter(key => !props?.includes(key));
		const keys2 = Object.keys(obj2).filter(key => !props?.includes(key));

		if (keys1.length !== keys2.length) return false;

		for (let key of keys1) {
			if (!keys2.includes(key)) return false;
			if (!filterAndCompare(obj1[key], obj2[key], props)) return false;
		}

		return true;
	};

	return filterAndCompare(json1, json2, filterProps);
};

export const getRandom = () => {
	return Math.floor(Math.random() * 30000); // 0 to 30000 ms
}

export const executeWithDelay = (fn, ...args) => {
	const delay = getRandom();
	console.log(`Wait ${delay / 1000}s to run random job.`);

	return new Promise((resolve) => {
		setTimeout(async () => {
			const result = await fn(...args);
			resolve(result);
		}, delay);
	});
}

export const generateDailyMinutes = (date, count = 10) => {
	// 参数验证和规范化
	if (count < 1) count = 1;
	if (count > 1440) count = 1440;

	// 将日期转换为一致的字符串格式（YYYY-MM-DD）
	const dateStr = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
	const normalizedDate = new Date(dateStr + 'T00:00:00Z'); // 使用UTC时间确保一致性

	// 创建确定性的种子（使用日期字符串的哈希值）
	let seed = 0;
	for (let i = 0; i < dateStr.length; i++) {
		seed = ((seed << 5) - seed) + dateStr.charCodeAt(i);
		seed = seed & seed; // 转换为32位整数
	}
	seed = Math.abs(seed);

	// 使用确定性随机数生成器
	const minutes = new Set();
	let attempts = 0;
	const maxAttempts = count * 10; // 防止无限循环

	while (minutes.size < count && attempts < maxAttempts) {
		// 简单的LCG算法，确保确定性
		seed = (seed * 1664525 + 1013904223) % 2147483647;

		// 生成0-1439之间的分钟数
		const minute = Math.abs(seed) % 1440;
		minutes.add(minute);

		attempts++;
	}

	// 如果因为重复而无法生成足够数量，补充剩余的数字
	if (minutes.size < count) {
		for (let i = 0; i < 1440 && minutes.size < count; i++) {
			minutes.add(i);
		}
	}

	// 转换为数组并排序
	return Array.from(minutes).sort((a, b) => a - b).slice(0, count);
}
