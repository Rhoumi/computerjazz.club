module.exports = function (eleventyConfig) {
  // Copy static assets to output
  eleventyConfig.addPassthroughCopy("src/assets/audio");
  eleventyConfig.addPassthroughCopy("src/assets/images");
  eleventyConfig.addPassthroughCopy("src/assets/css");
  eleventyConfig.addPassthroughCopy("src/assets/js");
  eleventyConfig.addPassthroughCopy("src/assets/fonts");

  // Add collection for audio
  eleventyConfig.addCollection("audio", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/audio/*.md").sort((a, b) => {
      return new Date(b.data.releaseDate) - new Date(a.data.releaseDate);
    });
  });

  // Add Markdown library
  const markdownIt = require("markdown-it")({
    html: true,
    breaks: true,
    linkify: true,
  });
  eleventyConfig.setLibrary("md", markdownIt);

  // Add markdown filter for Nunjucks templates
  eleventyConfig.addFilter("markdown", function (content) {
    return markdownIt.render(content);
  });

  // Add filter for truncating text
  eleventyConfig.addFilter("truncate", function (str, length = 150) {
    if (str.length <= length) return str;
    return str.substring(0, length) + "...";
  });

  // Add date filter
  eleventyConfig.addFilter("date", function (date, format) {
    const d = new Date(date);
    if (format === "%Y") {
      return d.getFullYear();
    }
    if (format === "%B %d, %Y") {
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return d.toISOString().split("T")[0]; // Default to YYYY-MM-DD
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
};
