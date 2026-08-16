import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions';

interface BackendStackProps extends cdk.StackProps {
  envName: string;
}


export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: BackendStackProps) {
    super(scope, id, props);

    const { envName } = props as BackendStackProps;

    /*
     ==========================================
     DATABASE
     ==========================================
    */
    const vendorTable = new dynamodb.Table(this, 'VendorTable', {
      tableName: `vendor-table-${envName}`,
      partitionKey: { name: 'vendorId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: envName === 'production'
        ? cdk.RemovalPolicy.RETAIN   // Never auto-delete production data
        : cdk.RemovalPolicy.DESTROY, // Auto-delete staging data when stack is removed
    });

    /*
     ==========================================
     LAMBDAS
     ==========================================
    */
    const lambdaEnv = {
      TABLE_NAME: vendorTable.tableName,
      ENV_NAME: envName,
    };

    const createVendorLambda = new NodejsFunction(this, 'CreateVendorHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'lambda/createVendor.ts',
      handler: 'handler',
      environment: lambdaEnv,
    });


    const getVendorsLambda = new NodejsFunction(this, 'GetVendorsHandler', {
      entry: 'lambda/getVendors.ts',
      handler: 'handler',
      environment: lambdaEnv,
    });

    const deleteVendorLambda = new NodejsFunction(this, 'DeleteVendorHandler', {
      entry: 'lambda/deleteVendor.ts',
      handler: 'handler',
      environment: lambdaEnv,
    });

    const updateVendorLambda = new NodejsFunction(this, 'UpdateVendorHandler', {
      entry: 'lambda/updateVendor.ts',
      handler: 'handler',
      environment: lambdaEnv,
    });


    /*
    ==========================================
    PERMISSIONS
    ==========================================
   */
    vendorTable.grantWriteData(createVendorLambda);
    vendorTable.grantReadData(getVendorsLambda);
    vendorTable.grantWriteData(deleteVendorLambda);
    vendorTable.grantWriteData(updateVendorLambda);

    /*
     ==========================================
     API GATEWAY
     ==========================================
    */
    const api = new apigateway.RestApi(this, 'VendorApi', {
      restApiName: 'Vendor Service',
      description: 'Handles vendor CRUD operations',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const vendors = api.root.addResource('vendors');

    const createIntegration = new apigateway.LambdaIntegration(createVendorLambda);
    const getIntegration = new apigateway.LambdaIntegration(getVendorsLambda);
    const deleteIntegration = new apigateway.LambdaIntegration(deleteVendorLambda);

    /*
     ==========================================
     COGNITO
     ==========================================
    */
    const userPool = new cognito.UserPool(this, 'VendorUserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.LINK,
      },
    });

    const cognitoDomainPrefix = `vendor-tracker-${envName}-${this.account}`.toLowerCase();

    userPool.addDomain('VendorUserPoolDomain', {
      cognitoDomain: {
        domainPrefix: cognitoDomainPrefix,
      },
    });

    const userPoolClient = userPool.addClient('VendorAppClient');

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      'VendorAuthorizer',
      { cognitoUserPools: [userPool] }
    );

    /*
     ==========================================
     API METHODS
     ==========================================
    */
    vendors.addMethod('POST', createIntegration, {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    vendors.addMethod('GET', getIntegration);

    vendors.addMethod('DELETE', deleteIntegration, {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    vendors.addMethod('PUT', new apigateway.LambdaIntegration(updateVendorLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });



    /*
     ==========================================
     FRONTEND HOSTING (S3 + CLOUDFRONT)
     ==========================================
    */
    const siteBucket = new s3.Bucket(this, 'VendorSiteBucket', {
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // new s3deploy.BucketDeployment(this, 'DeployWebsite', {
    //   sources: [s3deploy.Source.asset('../frontend/out')],
    //   destinationBucket: siteBucket,
    //   distribution,
    //   distributionPaths: ['/*'],
    // });

    /*
     =============================
     MONITORING
     =============================
    */
    const dashboard = new cloudwatch.Dashboard(this, 'VendorTrackerDash', {
      dashboardName: `VendorTrackerPerformance-${envName}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          createVendorLambda.metricInvocations(),
          getVendorsLambda.metricInvocations(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [
          createVendorLambda.metricErrors(),
          deleteVendorLambda.metricErrors(),
        ],
        stacked: true,
      })
    );

    const alarmEmail =
      this.node.tryGetContext('alarmEmail') ?? process.env.ALARM_EMAIL;

    if (alarmEmail) {
      const alarmTopic = new sns.Topic(this, 'VendorAlarmTopic', {
        topicName: `vendor-alarms-${envName}`,
      });

      alarmTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(alarmEmail)
      );

      const createErrorAlarm = (fn: NodejsFunction, name: string) => {
        const alarm = new cloudwatch.Alarm(this, `${name}ErrorAlarm`, {
          alarmName: `${name}-errors-${envName}`,
          alarmDescription: `Lambda errors in ${name} exceeded threshold`,
          metric: fn.metricErrors({
            period: cdk.Duration.minutes(5),
            statistic: 'Sum',
          }),
          threshold: 3,
          evaluationPeriods: 1,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        });
        alarm.addAlarmAction(new cwActions.SnsAction(alarmTopic));
      };

      createErrorAlarm(createVendorLambda, 'CreateVendor');
      createErrorAlarm(getVendorsLambda, 'GetVendors');
      createErrorAlarm(deleteVendorLambda, 'DeleteVendor');
      createErrorAlarm(updateVendorLambda, 'UpdateVendor');

      const latencyAlarm = new cloudwatch.Alarm(this, 'ApiLatencyAlarm', {
        alarmName: `api-latency-${envName}`,
        alarmDescription: 'API Gateway p99 latency exceeded 3 seconds',
        metric: api.metricLatency({
          period: cdk.Duration.minutes(5),
          statistic: 'p99',
        }),
        threshold: 3000,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      latencyAlarm.addAlarmAction(new cwActions.SnsAction(alarmTopic));

      const throttleAlarm = new cloudwatch.Alarm(this, 'DynamoThrottleAlarm', {
        alarmName: `dynamo-throttles-${envName}`,
        alarmDescription: 'DynamoDB is throttling requests',
        metric: vendorTable.metricThrottledRequestsForOperations({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      throttleAlarm.addAlarmAction(new cwActions.SnsAction(alarmTopic));
    }

    /*
     ==========================================
     OUTPUTS
     ==========================================
    */
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, envName === 'production' ? 'ProdBucketName' : 'StagingBucketName', {
      value: siteBucket.bucketName,
    });

    new cdk.CfnOutput(this, envName === 'production' ? 'ProdDistributionId' : 'StagingDistributionId', {
      value: distribution.distributionId,
    });
  }
}
