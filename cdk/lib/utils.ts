import * as assert from 'assert';
import { Node } from 'constructs';

export const getStage = (node: Node): string => {
  return node.tryGetContext('stage') ?? 'dev';
};

const getEnv = (key: string): string => {
  const value = process.env[key];
  assert(
    typeof value === 'string',
    `Not found context key=${key} in environment variable`
  );
  return value;
};

export interface StageConfig {
  account: string;
  certificateArn: string;
  domainName: string;
  region: string;
  resourceNamePrefix: string;
}

export const getStageConfig = (node: Node): StageConfig => {
  const stage = getStage(node);
  return {
    account: getEnv('SAMPLE_MTLS_ACCOUNT'),
    certificateArn: getEnv('SAMPLE_MTLS_CERTIFICATE_ARN'),
    domainName: getEnv('SAMPLE_MTLS_DOMAIN_NAME'),
    region: 'ap-northeast-1',
    resourceNamePrefix: `gky360-${stage}-sample-mtls`,
  };
};
