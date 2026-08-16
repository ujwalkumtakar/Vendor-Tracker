#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/backend-stack';

const app = new cdk.App();

// Read the target environment from a CDK context variable
// Usage: cdk deploy -c env=staging  OR  cdk deploy -c env=production
const envName = app.node.tryGetContext('env') ?? 'staging';

if (!['staging', 'production'].includes(envName)) {
  throw new Error(`Invalid env context value: "${envName}". Must be "staging" or "production".`);
}

new BackendStack(app, `VendorTracker-${envName}`, {
  envName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
});
