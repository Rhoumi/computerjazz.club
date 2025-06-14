import Fetch from "@11ty/eleventy-fetch";

export default async function () {
	let url = "http://backend-dev:8090/api/collections/tracks/records";

	let json = await Fetch(url, {
		duration: "10s", // save for 1 day
		type: "json", // we’ll parse JSON for you
	});

	return json;
};