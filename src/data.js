import { Datastore, PropertyFilter, and } from '@google-cloud/datastore';
import { Storage } from '@google-cloud/storage';

import { BACKUP_BUCKET, FILE_INFO, FILE_LOG, FILE_WORK_LOG, DELETED } from './const';

const datastore = new Datastore();
const storage = new Storage();

const queryData = async (query, readOnly) => {
  const transaction = datastore.transaction({ readOnly });
  try {
    await transaction.run();
    const [entities] = await transaction.runQuery(query);
    await transaction.commit();
    return entities;
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
};

const deleteData = async (keys, nKeys = 64) => {
  for (let i = 0; i < keys.length; i += nKeys) {
    const selectedKeys = keys.slice(i, i + nKeys);

    const transaction = datastore.transaction();
    try {
      await transaction.run();

      transaction.delete(selectedKeys);
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }
};

const deleteFiles = async (bucketName, paths, nItems = 32) => {
  const bucket = storage.bucket(bucketName);
  for (let i = 0; i < paths.length; i += nItems) {
    const selectedPaths = paths.slice(i, i + nItems);
    await Promise.all(
      selectedPaths.map(path => {
        const bucketFile = bucket.file(path);
        return bucketFile.delete().catch(error => {
          console.log(`In deleteFiles, ${path} has error:`, error);
        });
      })
    );
  }
};

const getDeletedFileInfos = async (nLimit) => {
  const dt = Date.now() - (31 * 24 * 60 * 60 * 1000);
  const date = new Date(dt);

  const query = datastore.createQuery(FILE_INFO);
  query.filter(and([
    new PropertyFilter('status', '=', DELETED),
    new PropertyFilter('updateDate', '<', date),
  ])); // Need Composite Index Configuration in index.yaml in sdrive-hub
  query.order('updateDate', { descending: false });
  query.limit(nLimit);

  const entities = await queryData(query, true);

  const infos = [];
  for (const entity of entities) {
    const info = {
      path: entity[datastore.KEY].name,
      status: entity.status,
      size: entity.size,
      createDate: entity.createDate,
      updateDate: entity.updateDate,
    };
    infos.push(info);
  }
  return infos;
};

/*const getObsoleteSDriveHub = async () => {
  // BucketInfos, FileInfos
};*/

const deleteSDriveHubBackUp = async (infos) => {
  const paths = [];
  for (const info of infos) {
    paths.push(info.path);
  }

  await deleteFiles(BACKUP_BUCKET, paths, 240);
};

/*const deleteBucketInfos = async () => {

};*/

const deleteFileInfos = async (infos) => {
  const keys = [];
  for (const info of infos) {
    keys.push(datastore.key([FILE_INFO, info.path]));
  }

  await deleteData(keys, 240);
};

const getObsoleteFileLogs = async (nLimit) => {
  const dt = Date.now() - (31 * 24 * 60 * 60 * 1000);
  const date = new Date(dt);

  const query = datastore.createQuery(FILE_LOG);
  query.filter(new PropertyFilter('createDate', '<', date));
  query.order('createDate', { descending: false });
  query.limit(nLimit);

  const entities = await queryData(query, true);

  const logs = [];
  for (const entity of entities) {
    const log = {
      name: entity[datastore.KEY].name,
      createDate: entity.createDate,
    };
    logs.push(log);
  }
  return logs;
};

const deleteFileLogs = async (logs) => {
  const keys = [];
  for (const log of logs) {
    keys.push(datastore.key([FILE_LOG, log.name]));
  }

  await deleteData(keys, 2048);
};

const getObsoleteFileWorkLogs = async (nLimit) => {
  const dt = Date.now() - (31 * 24 * 60 * 60 * 1000);
  const date = new Date(dt);

  const query = datastore.createQuery(FILE_WORK_LOG);
  query.filter(new PropertyFilter('createDate', '<', date));
  query.order('createDate', { descending: false });
  query.limit(nLimit);

  const entities = await queryData(query, true);

  const logs = [];
  for (const entity of entities) {
    const log = {
      id: entity[datastore.KEY].id,
      createDate: entity.createDate,
    };
    logs.push(log);
  }
  return logs;
};

const deleteFileWorkLogs = async (logs) => {
  const keys = [];
  for (const log of logs) {
    keys.push(datastore.key([FILE_WORK_LOG, datastore.int(log.id)]));
  }

  await deleteData(keys, 256);
};

const data = {
  getDeletedFileInfos, deleteSDriveHubBackUp, deleteFileInfos, getObsoleteFileLogs,
  deleteFileLogs, getObsoleteFileWorkLogs, deleteFileWorkLogs,
};

export default data;
