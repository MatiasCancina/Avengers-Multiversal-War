var fs = require('fs');

var url = process.env.API_BASE_URL;
if (!url) {
  console.log('API_BASE_URL no definida: se deja environment.ts como está');
  process.exit(0);
}

fs.writeFileSync(
  'src/environments/environment.ts',
  "export const environment = {\n  apiBaseUrl: ' " + url + "',\n};\n"
);
