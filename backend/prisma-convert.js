const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Fix: numeric defaults that were incorrectly quoted  e.g. @default("40") -> @default(40)
// Pattern: field is Float or Int, and default is a quoted number
content = content.replace(/@default\("(\d+(?:\.\d+)?)"\)/g, '@default($1)');

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Fixed numeric defaults!');
