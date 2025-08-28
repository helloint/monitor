// ./scripts/utils.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Needed to get __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const writeDataFile = (relativeFilePath, data) => {
	try {
		const dataDir = path.resolve(__dirname, '..');
		const filePath = path.join(dataDir, relativeFilePath);

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
	// Resolve the file path relative to the ./data/ directory
	const dataDir = path.resolve(__dirname, '..'); // Adjust as necessary to get the data directory
	const filePath = path.join(dataDir, relativeFilePath);

	try {
		const data = fs.readFileSync(filePath, 'utf8');
		return JSON.parse(data.trim());
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

	return `${year}/${month}/${day}/${hours}${minutes}.json`;
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
