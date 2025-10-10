import * as sass from 'sass';
import path from 'path';
import YAML from "yaml";
import { DateTime } from "luxon";

import markdownIt from "markdown-it";
import markdownItAttrs from "markdown-it-attrs";
import implicitFigures from "markdown-it-implicit-figures";


export default function (eleventyConfig) {

    // copy decap admin files to the output folder
    eleventyConfig.addPassthroughCopy("admin");

    // javascript
    eleventyConfig.addPassthroughCopy("scripts");

	// run local server
	  eleventyConfig.setServerOptions({
		port: 8080,         
		showAllHosts: true  // allow access from local network
	});

	// compile SCSS files
	eleventyConfig.addWatchTarget("./public/*.scss");
	eleventyConfig.addTemplateFormats("scss");

	eleventyConfig.addExtension("scss", {
		outputFileExtension: "css",
		compile: async function (inputContent) {
			let result = sass.compileString(inputContent);
			return async () => result.css;
		},
	});

    // Read YAML files in the _data folder
    eleventyConfig.addDataExtension("yml", (contents) => YAML.parse(contents));

    // Custom image rendering:
    
    // **********************************
    // Copy original uploads (for CMS preview)
    eleventyConfig.addPassthroughCopy({
        "content/uploads": "uploads"
    });

    // Copy processed images (overwrites originals on the public site when used)
    eleventyConfig.addPassthroughCopy({
        "content/uploads/_processed": "uploads"
    });

    // convert any image path to a .webp path
    eleventyConfig.addFilter("toWebp", (src) => {
        if (!src) return src;
        const ext = path.extname(src);             // ".jpg"
        const basename = path.basename(src, ext);  // "blue"
        const dir = path.dirname(src);             // "/uploads"
        // swap extension to .webp
        return path.join(dir, `${basename}.webp`).replace(/\\/g, "/");
    });
    // **********************************

    // Add some fluff to the markdown

    const md = markdownIt({ html: true, breaks: true })
        .use(markdownItAttrs, {
        allowedAttributes: ["id", "class", /^data-.*$/],
        })
        .use(implicitFigures, {
        figcaption: "title",
        copyAttrs: true,
        });

    // merge `{.class}` on next line into the previous image
    const imageClassMergePlugin = (md) => {
        const originalParse = md.parse;
        md.parse = function (src, env) {
        src = src.replace(
            /(!\[.*?\]\(.*?\s*".*?"\))\s*\n\s*\{\.([^}]+)\}/g,
            (_, img, cls) => `${img}{.${cls}}`
        );
        return originalParse.call(this, src, env);
        };
    };
    md.use(imageClassMergePlugin);

    eleventyConfig.setLibrary("md", md);

    // render as markdown (to use inline as | markdown | safe | in templates)
    eleventyConfig.addFilter("markdown", (content) => {
        if (!content) return "";
        return md.render(content);
    });

    // Date formatting filter
    eleventyConfig.addFilter("formatDate", (dateObj) => {
        if (!dateObj) return "";
        const jsDate = dateObj instanceof Date ? dateObj : new Date(dateObj);
        return DateTime.fromJSDate(jsDate).toFormat("dd/MM/yyyy");
    });
    

	return {
		dir: {
			input: ".",
			output: "_site",
			includes: "_includes",
		},
		markdownTemplateEngine: "njk", // use Nunjucks inside Markdown
    	htmlTemplateEngine: "njk",     // use Nunjucks inside .html files
    	dataTemplateEngine: "njk",     // use Nunjucks in .json/.yml/.js data files
	};
}
