#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SampleMtlsStack } from '../lib/sample-mtls-stack';
import { getStage, getStageConfig } from '../lib/utils';

const app = new cdk.App();

const stage = getStage(app.node);

const stageConfig = getStageConfig(app.node);
const { account, certificateArn, domainName, region, resourceNamePrefix } =
  stageConfig;

cdk.Tags.of(app).add('Environment', stage);
cdk.Tags.of(app).add('Cost', 'sample-mtls');

const env = { account, region };

new SampleMtlsStack(app, `${resourceNamePrefix}-stack`, {
  env,
  certificateArn,
  domainName,
  resourceNamePrefix,
});
