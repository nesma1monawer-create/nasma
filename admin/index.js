// custom image with class editor component

CMS.registerEditorComponent({
  id: "imageWithClass",
  label: "Image with class",
  fields: [
    { name: "src", label: "Image", widget: "image" },
    { name: "alt", label: "Description (for accessibility)", widget: "string" },
    { name: "title", label: "Caption", widget: "string", default: " ", required: false },
    {
      name: "size",
      label: "Size",
      widget: "select",
      options: [
        { label: "Small", value: "small" },
        { label: "Medium", value: "medium" },
        { label: "Large", value: "large" },
        { label: "Extra Large", value: "extra-large" }
      ],
      default: "medium"
    }
  ],

  pattern: /^!\[(.*?)\]\((.*?)\s*"(.*?)"\)\{\.([^}]+)\}$/,

  fromBlock(match) {
    return {
      alt: match[1],
      src: match[2],
      title: match[3],
      size: match[4]
    };
  },

  toBlock({ alt, src, title, size }) {
    return `![${alt}](${src} "${title || ""}"){.${size}}`;
  },

  toPreview({ alt, src, title, size }) {
    return `
      <figure class="${size}" style="max-width: 100%; text-align: center;">
        <img src="${src}" alt="${alt}" style="max-width: 100%;" />
        ${title ? `<figcaption>${title}</figcaption>` : ""}
      </figure>
    `;
  }
});
