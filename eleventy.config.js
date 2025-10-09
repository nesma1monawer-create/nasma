import * as sass from 'sass';
import path from 'path';
import YAML from "yaml";

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
      // --- Custom plugin to merge `{.class}` on next line into the previous image
    const imageClassMergePlugin = (md) => {
        const originalParse = md.parse;
        md.parse = function (src, env) {
        // Preprocess source to merge lines where {.class} follows an image
        src = src.replace(
            /(!\[.*?\]\(.*?\s*".*?"\))\s*\n\s*\{\.([^}]+)\}/g,
            (_, img, cls) => `${img}{.${cls}}`
        );
        return originalParse.call(this, src, env);
        };
    };

    eleventyConfig.setLibrary(
        "md",
        markdownIt({
        html: true,
        breaks: true,
        })
        .use(imageClassMergePlugin) // must come first
        .use(markdownItAttrs, {
            allowedAttributes: ["id", "class", /^data-.*$/],
        })
        .use(implicitFigures, {
            figcaption: "title",
            copyAttrs: true,
        })
        .use((md) => {
            const defaultRender =
            md.renderer.rules.image ||
            ((tokens, idx, options, env, self) =>
                self.renderToken(tokens, idx, options));

            md.renderer.rules.image = (tokens, idx, options, env, self) => {
            const token = tokens[idx];
            const srcIndex = token.attrIndex("src");

            if (srcIndex >= 0) {
                let src = token.attrs[srcIndex][1];
                token.attrs[srcIndex][1] = eleventyConfig.getFilter("toWebp")(src);
            }

            return defaultRender(tokens, idx, options, env, self);
            };
        })
    );

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
