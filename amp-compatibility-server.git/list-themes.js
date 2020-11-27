const { getThemesList } = require("@rtcamp/wporg-api-client");

const themesList = async () => {
	let data = {};

	try {
		data = await getThemesList();
		console.log(data.data.themes, "theme data");
	} catch (error) {
		console.log(error.message, "error");
	}
};

themesList();