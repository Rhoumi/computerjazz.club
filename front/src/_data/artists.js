import EleventyFetch from "@11ty/eleventy-fetch";
import fs from "fs";
import path from "path";

let PUBLIC_POCKETBASE_URL = process.env.PUBLIC_POCKETBASE_URL
let PRIVATE_POCKETBASE_URL = process.env.PRIVATE_POCKETBASE_URL

export default async function () {
	let url = `${PRIVATE_POCKETBASE_URL}/api/collections/artists/records`;

	let artists = await EleventyFetch(url, {
		duration: "1m", // Increased duration
		type: "json",
		fetchOptions: {
			headers: {
				"Cache-Control": "no-cache"
			}
		}
	});

	// Ensure output images directory exists
	let outputDir = "_site/images/artists";
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	// Process each artist and cache their images
	for (let artist of artists.items) {
		if (artist.image) {
			const imageUrl = `${PRIVATE_POCKETBASE_URL}/api/files/artists/${artist.id}/${artist.image}`;
			
			try {
				const imageBuffer = await EleventyFetch(imageUrl, {
					duration: "1m",
					type: "buffer",
				});
				
				const outputFileName = `${artist.id}-${artist.image}`;
				const outputPath = path.join(outputDir, outputFileName);
				
				fs.writeFileSync(outputPath, imageBuffer);
				artist.imageUrl = `/images/artists/${outputFileName}`;
				
			} catch (error) {
				console.error(`Failed to cache image for artist ${artist.name}:`, error);
				artist.imageUrl = imageUrl;
			}
		}

		// Store original album IDs and fetch album details
		if (artist.albums && Array.isArray(artist.albums) && artist.albums.length > 0) {
			// Check if albums are still IDs (strings) and not already fetched objects
			if (typeof artist.albums[0] === 'string') {
				console.log(`Artist ${artist.name} has album IDs:`, artist.albums);
				
				const albumsUrl = `${PRIVATE_POCKETBASE_URL}/api/collections/albums/records?filter=(id="${artist.albums.join('") || (id="')}")&expand=tracks`;
				console.log(`Fetching albums for artist ${artist.name}`);
				let outputDir = "_site/images/albums";
				if (!fs.existsSync(outputDir)) {
					fs.mkdirSync(outputDir, { recursive: true });
				}
				try {
					const albums = await EleventyFetch(albumsUrl, {
						duration: "1m",
						type: "json",
						// Use a unique cache key for each artist's albums
						directory: ".cache",
						hashLength: 30,
					});
					
					console.log(`Fetched ${albums.items.length} albums for artist ${artist.name}`);
					// get the album cover images
					for (let album of albums.items) {
						if (album.cover) {
							const imageUrl = `${PRIVATE_POCKETBASE_URL}/api/files/albums/${album.id}/${album.cover}`;
							console.log(`Caching image for album ${album.name} from ${imageUrl}`);
							try {
								const imageBuffer = await EleventyFetch(imageUrl, {
									duration: "1m",
									type: "buffer",
								});
								
								const outputFileName = `${album.id}-${album.cover}`;
								const outputPath = path.join(outputDir, outputFileName);
								fs.writeFileSync(outputPath, imageBuffer);
								album.imageUrl = `/images/albums/${outputFileName}`;

							} catch (error) {
								console.error(`Failed to cache image for album ${album.name}:`, error);
								album.imageUrl = imageUrl;
							}
						}
					}
					// Create a new property for the full album objects
					artist.albumDetails = albums.items;
					// Keep original IDs in case needed
					artist.albumIds = [...artist.albums];
					// Replace albums with full objects
					artist.albums = albums.items;
					
				} catch (error) {
					console.error(`Failed to fetch albums for artist ${artist.name}:`, error);
					artist.albums = [];
				}
			} else {
				console.log(`Albums already fetched for artist ${artist.name}`);
			}
		}
	}

	return artists.items;
};