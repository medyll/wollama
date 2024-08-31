// run-module.js
import { idaeApi } from '@medyll/idae-api';

async function startApi() {
  idaeApi.setOptions({ port: 3000 });
  await idaeApi.start();
  console.log('IDAE API started successfully ----------------------------------------------------------');
}

startApi().catch(console.error);