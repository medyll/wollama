import { execSync } from 'child_process';

const modules = [
  '@medyll/idae-api',
  '@medyll/idae-be',
  '@medyll/idae-data-tpl',
  '@medyll/idae-dom-events',
  '@medyll/idae-engine',
  '@medyll/idae-idbql',
  '@medyll/idae-mongo',
  '@medyll/idae-query',
  '@medyll/idae-slotui-svelte'
];

const command = process.argv[2];

if (command === 'link') {
  modules.forEach(module => {
    console.log(`Linking ${module}...`);
    execSync(`npm link ${module} -f --save`, { stdio: 'inherit' });
  });
} else if (command === 'unlink') {
  modules.forEach(module => {
    console.log(`Unlinking ${module}...`);
    execSync(`npm unlink ${module} -f`, { stdio: 'inherit' });
    console.log('Reinstalling npm packages...');
    execSync(`npm i ${module}@next -f`, { stdio: 'inherit' });
  });
} else {
  console.log('Invalid command. Use "link" or "unlink".');
}