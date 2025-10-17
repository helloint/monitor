async function main() {
	const data = process.env.data;

	if (data && data.trim() !== '') {
		const notifyItems = JSON.parse(data);
		console.log(`收到 ${notifyItems.length} 条通知消息`);

		// 处理每条通知消息
		for (const notifyItem of notifyItems) {
			const { message, types } = notifyItem;
			console.log(`发送消息: ${message}`);
			console.log(`通知类型: ${types.join(', ')}`);

			// 并发发送所有类型的通知
			const promises = types.map(type => sendNotificationByType(message, type));
			await Promise.allSettled(promises);
		}
	} else {
		console.log('没有通知消息需要发送');
	}
}

// 根据类型发送通知
async function sendNotificationByType(message, type) {
	switch (type) {
		case 'synology':
			await sendSynologyNotification(message);
			break;
		case 'pushplus':
			await sendPushplusNotification(message);
			break;
		default:
			console.log(`未知的通知类型: ${type}`);
	}
}

// 发送Synology Chat通知
async function sendSynologyNotification(message) {
	const notifyServer = process.env.notify_server;
	const notifyToken = process.env.notify_token;

	if (!notifyServer || !notifyToken) {
		console.log('Synology Chat: NOTIFY_SERVER 或 NOTIFY_TOKEN 环境变量未配置');
		return;
	}

	const data = {
		payload: JSON.stringify({
			text: message
		}),
		token: notifyToken
	};

	const options = {
		method: 'POST',
		body: Object.entries(data).map(([key, value]) => `${key}=${value}`).join('&')
	};

	try {
		await fetch(`${notifyServer}/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2`, options);
		console.log('Synology Chat notification sent successfully');
	} catch (error) {
		console.error('Synology Chat notification failed:', error.message);
	}
}

// 发送pushplus通知
async function sendPushplusNotification(message) {
	const pushplusToken = process.env.pushplus_notify_token;
	const pushplusServer = process.env.pushplus_notify_server || 'http://www.pushplus.plus/send';

	if (!pushplusToken) {
		console.log('Pushplus: PUSHPLUS_NOTIFY_TOKEN 环境变量未配置');
		return;
	}

	const data = {
		token: pushplusToken,
		title: 'Monitor通知',
		content: message,
		template: 'txt'
	};

	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	};

	try {
		const response = await fetch(pushplusServer, options);
		const result = await response.json();

		if (result.code === 200) {
			console.log('Pushplus notification sent successfully');
		} else {
			console.error('Pushplus notification failed:', result.msg);
		}
	} catch (error) {
		console.error('Pushplus notification request failed:', error.message);
	}
}

main();
