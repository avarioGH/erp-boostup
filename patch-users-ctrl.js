const fs = require('fs');
let file = 'backend/src/users/users.controller.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the hardcoded block with just checking if they have the permission (handled by @Permissions guard)
const startBlock = content.indexOf('if (');
const endBlock = content.indexOf('throw new ForbiddenException(\'Hanya Owner yang dapat membuat akun Admin\');');
const closingBrace = content.indexOf('}', endBlock);

if (startBlock > -1 && endBlock > -1 && closingBrace > -1) {
  content = content.slice(0, startBlock) + content.slice(closingBrace + 1);
  fs.writeFileSync(file, content);
  console.log('Controller patched successfully');
} else {
  console.log('Could not find the block to remove');
}
