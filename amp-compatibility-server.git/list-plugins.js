const { getPluginsList } = require("@rtcamp/wporg-api-client");

const pluginsList = async () => {
	let data = {};

	try {
		data = await getPluginsList();
		console.log(data.data.plugins, "plugin data");
	} catch (error) {
		console.log(error.message, "error");
	}
};

pluginsList();