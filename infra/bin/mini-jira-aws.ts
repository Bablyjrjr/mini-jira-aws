#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MiniJiraAwsStack } from '../lib/mini-jira-aws-stack';

const app = new cdk.App();
new MiniJiraAwsStack(app, 'MiniJiraAwsStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
