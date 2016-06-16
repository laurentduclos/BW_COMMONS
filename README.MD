# BoatingWay Commons

This is a collection of modules that are shared between BoatingWay services.

## Instructions

The repo is used as a Git Subtree for all microservices that depend on it.

###To add it to a new service:

- `git remote add bw_commons https://github.com/laurentduclos/BW_COMMONS.git`
- `git subtree add --prefix=bw_commons/ bw_commons master`

The above 2 commands will pull this repository to the *bw_commons* forlder on your local project.

###Modify and sync common modules

If a change need to be made on this repo. You need:

- Clone this repo and make the modifications
- Save and push your modifications
- run: `git subtree pull bw_commons master —prefix=bw_commons/`

### Tests

#### OSSManager

You could run test with

```
npm install mocha sinon chai babel-register ali-oss
OSS_ACCESS_KEY_ID=[key_id] OSS_ACCESS_KEY_SECRET=[key_secret] OSS_REGION=[region] OSS_BUCKET=[bucket_name] mocha --compilers js:babel-register _tests/Classes/OSSManager.specs.js
```

@TODO

Write tests
