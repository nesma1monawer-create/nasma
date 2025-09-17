import * as sass from 'sass';
import fs from 'fs';
import path from 'path';

// add some extra fluff to the markdown
import markdownIt from "markdown-it";
import markdownItAttrs from "markdown-it-attrs";
import implicitFigures from "markdown-it-implicit-figures";


export default function (eleventyConfig) {

    // copy decap admin files to the output folder
    eleventyConfig.addPassthroughCopy("admin");

	// run local server
	  eleventyConfig.setServerOptions({
		port: 8080,         // or your desired port
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

    eleventyConfig.setLibrary(
        "md",
        markdownIt({ html: true })
        .use(markdownItAttrs)
        .use(implicitFigures, {
            figcaption: "title", // use the image title as <figcaption>
            copyAttrs: true,     // copy class/id attributes
        })
        .use((md) => {
            const defaultRender =
            md.renderer.rules.image ||
            ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

            md.renderer.rules.image = (tokens, idx, options, env, self) => {
            const token = tokens[idx];
            const srcIndex = token.attrIndex("src");

            if (srcIndex >= 0) {
                let src = token.attrs[srcIndex][1];

                // If no folder is present, assume global uploads
                if (!src.includes("/")) {
                src = "uploads/" + src;
                }

                // Use .webp for all images
                if (!src.toLowerCase().endsWith(".webp")) {
                src = src.replace(/\.(jpg|jpeg|png)$/i, ".webp");
                }

                token.attrs[srcIndex][1] = src;
            }

            return defaultRender(tokens, idx, options, env, self);
            };
        })
  );

  // Copy processed images from uploads/_processed to _site/uploads
  eleventyConfig.addPassthroughCopy({
    "content/uploads/_processed": "uploads"
  });

  // After build: remove original JPG/PNG images from _site/uploads
  eleventyConfig.on("afterBuild", () => {
    const uploadsDir = "_site/uploads";

    if (!fs.existsSync(uploadsDir)) return;

    const removeOriginals = (dir) => {
      fs.readdirSync(dir).forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          removeOriginals(fullPath);
        } else if (/\.(jpe?g|png)$/i.test(file)) {
          fs.unlinkSync(fullPath);
        }
      });
    };

    removeOriginals(uploadsDir);
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
