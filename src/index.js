import dataApi from './data';
import { randomString, sampleConsoleLog } from './utils';

const doDryRun = process.env.DRY_RUN === 'true';

const CDSDH = 'cleanDeletedSDriveHub';
const CSDH = 'cleanSDriveHub';
const CFL = 'cleanFileLog';
const CFWL = 'cleanFileWorkLog';

const cleanDeletedSDriveHub = async () => {
  const startDate = new Date();
  const logKey = randomString(12);
  console.log(`(${logKey}) clean starts on ${startDate.toISOString()}`);
  console.log(`(${logKey}) doDryRun: ${doDryRun}`);

  const infos = await dataApi.getDeletedFileInfos();
  sampleConsoleLog(infos)
  console.log(`(${logKey}) Got ${infos.length} entities`);
  if (infos.length > 0) {
    if (!doDryRun) await dataApi.deleteSDriveHubBackUp(infos);
    console.log(`(${logKey}) Deleted in the backup bucket`);

    if (!doDryRun) await dataApi.deleteFileInfos(infos);
    console.log(`(${logKey}) Deleted the entities`);
  }
};

const cleanSDriveHub = async () => {
  const startDate = new Date();
  const logKey = randomString(12);
  console.log(`(${logKey}) clean starts on ${startDate.toISOString()}`);
  console.log(`(${logKey}) doDryRun: ${doDryRun}`);

  console.log('Not implemented.');
};

const cleanFileLog = async () => {
  const startDate = new Date();
  const logKey = randomString(12);
  console.log(`(${logKey}) clean starts on ${startDate.toISOString()}`);
  console.log(`(${logKey}) doDryRun: ${doDryRun}`);

  const nLimit = 20480;
  for (let i = 0; i < 10; i++) {
    const logs = await dataApi.getObsoleteFileLogs(nLimit);
    sampleConsoleLog(logs);
    console.log(`(${logKey}) Got ${logs.length} entities`);
    if (logs.length > 0) {
      if (!doDryRun) await dataApi.deleteFileLogs(logs);
      console.log(`(${logKey}) Deleted the entities`);
    }

    if (logs.length < nLimit) break;
  }
};

const cleanFileWorkLog = async () => {
  const startDate = new Date();
  const logKey = randomString(12);
  console.log(`(${logKey}) clean starts on ${startDate.toISOString()}`);
  console.log(`(${logKey}) doDryRun: ${doDryRun}`);

  const logs = await dataApi.getObsoleteFileWorkLogs();
  sampleConsoleLog(logs);
  console.log(`(${logKey}) Got ${logs.length} entities`);
  if (logs.length > 0) {
    if (!doDryRun) await dataApi.deleteFileWorkLogs(logs);
    console.log(`(${logKey}) Deleted the entities`);
  }
};

const main = async () => {
  const cleanName = process.env.CLEAN_NAME;
  if (cleanName === CDSDH) {
    await cleanDeletedSDriveHub();
    return;
  }
  if (cleanName === CSDH) {
    await cleanSDriveHub();
    return;
  }
  if (cleanName === CFL) {
    await cleanFileLog();
    return;
  }
  if (cleanName === CFWL) {
    await cleanFileWorkLog();
    return;
  }

  console.log('Please specify CLEAN_NAME as cleanDeletedSDriveHub, cleanSDriveHub, cleanFileLog, or cleanFileWorkLog.');
};
main();
