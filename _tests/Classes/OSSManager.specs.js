'use strict';
import chai from "chai";
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';

const expect = chai.expect;

import * as oss from '../../services/OSSManager';

let testDir = 'test';
let targetDir = 'target';
describe("Repo master class", () => {
  before((done) => {
    oss.deleteDirectory(testDir).then(() => {
      oss.deleteDirectory(targetDir).then(() => {
        done();
      });
    });
  });

  it("should list empty directory", (done) => {
    oss.listDirectory(testDir).then((data) => {
      console.log(data.objects);
      expect(data.objects).to.equal(undefined);
      done();
    });
  });

  it('should upload an image file', (done) => {
    let filename = 'berry.jpg';
    let fullpath = path.join(__dirname, "../assets/", filename);
    let file = fs.createReadStream(fullpath);
    let key = path.join(testDir, filename);

    oss.upload(file, key).then(() => {
      console.log('uploaded');
      oss.listDirectory(testDir).then((data) => {
        let count = data.objects.length;
        // expect(count).to.equal(1);
        done();
      });
    });
  });

  it('should move a directory', (done) => {
    oss.moveDirectory(testDir, targetDir).then(() => {
      oss.listDirectory(targetDir).then((data) => {
        console.log(data);
        expect(data.objects.length).to.equal(1);
        done();
      });
    })
  });

});
