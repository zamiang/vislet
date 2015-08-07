var fs = require('fs');

module.exports = {
  dest: './dist',
  paths: {
    scripts: ["assets/*.coffee"],
    styles: ["assets/*.styl"],
    images: ["images/*"],
    templates: ["apps/*/templates/index.jade"]
  },
  aws: JSON.parse(fs.readFileSync('./aws.json')),
  defaultCacheControl: "max-age=315360000, no-transform, public"
};
