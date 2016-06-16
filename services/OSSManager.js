import fs from 'fs';
import co from 'co';
import path from 'path';
import {
  Wrapper
} from 'ali-oss';
const OSS = Wrapper;

let client = new OSS({
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  region: process.env.OSS_REGION,
  bucket: process.env.OSS_BUCKET
});


/**
 * Send a file to oss bucket
 *
 * @param  {Stream} file: the file to be uploaded
 * @param  {String} path: the full path within the bucket: i.e.: boats/some_boat_id/filename.ext
 * @return {Promise}
 */
export const upload = function(file, path = "") {
  return client.put(path, file).catch(function(err) {
    console.log(`ERROR: ${err}`);
  });
};

/**
 * remove a file from a oss bucket
 *
 * @param  {String} path: the full path within the bucket: i.e.: boats/some_boat_id/filename.ext
 * @return {Promise}
 */
export const deleteObject = function(path) {
  if (!path) throw new Error('No path was specified');
  return client.delete(path).catch(function(err) {
    console.log(`ERROR: ${err}`);
  });
};

/**
 * list files inside directory from oss bucket
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
export const listDirectory = function(path) {
  if (!path) throw new Error('No path was specified');
  return client.list({
    prefix: path
  }).catch(function(err) {
    console.log(`ERROR: ${err}`);
  });
};

/**
 * remove a whole directory from a oss bucket
 *
 * i.e. boats/some_id/pictures/ => remove all pictures
 *
 * @param  {String} path: the full path within the bucket: i.e.: boats/some_boat_id/filename.ext
 * @return {Promise}
 */
export const deleteDirectory = function(path) {
  if (!path) throw new Error('No path was specified');
  return listDirectory(path).then((result) => {
    if (result.objects) {
      let names = result.objects.map((obj) => {
        return obj.name;
      });
      return client.deleteMulti(names);
    } else {
      return new Promise((resolve, reject) => {
        resolve();
      });
    }
  }, (err) => {
    return new Promise((resolve, reject) => {
      reject();
    });
  });
};

/**
 * move a whole directory from one path to an other
 *
 * i.e. tmp/some_id/pictures/ => boats/some_id/pictures/
 *
 * @param  {String} from: the full path of the directory. i.e.: tmp/some_id/pictures
 * @param  {String} to: the full path of the NEW directory. i.e.: boats/some_id/pictures
 * @return {Promise}
 */
export const moveDirectory = function(from, to) {
  if (!from) throw new Error('No path was specified');
  return listDirectory(from).then((result) => {
    let promises = [];
    console.log(result.objects);
    result.objects.map((obj) => {

      // unless obj is directory itself
      if (obj.name != path.join(from, '/')) {
        let basename = path.basename(obj.name);
        let fromName = path.join(from, basename);
        let toName = path.join(to, basename);
        console.log(`to name: ${toName}`);
        console.log(`from name: ${fromName}`);
        promises.push(client.copy(toName, fromName));
      }
    });
    return Promise.all(promises).then(() => {
      return deleteDirectory(from);
    });
  }, (err) => {
    return new Promise((resolve, reject) => {
      reject(err);
    });
  });
};
