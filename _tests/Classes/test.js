'use strict';
import chai from "chai";
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';

const expect = chai.expect;

import * as oss from '../../services/OSSManager';

let testDir = 'test';
let filename = 'berry.jpg';
let fullpath = path.join(__dirname, "../assets/", filename);
let file = fs.readFileSync(fullpath);
let key = path.join(testDir, filename);

oss.upload(file, key).then(() => {
  console.log("success");
  expect.fail();
  oss.listDirectory(testDir).then((data) => {
    expect(data.objects.length).equals(3);
    done();
  });
}, () => {
  expect.fail();
});
