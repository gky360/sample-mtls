import { Stack, StackProps } from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as path from 'path';

const APIGW_STAGE_NAME = 'default';

interface SampleMtlsStackProps extends StackProps {
  certificateArn: string;
  domainName: string;
  resourceNamePrefix: string;
}

export class SampleMtlsStack extends Stack {
  constructor(scope: Construct, id: string, props: SampleMtlsStackProps) {
    super(scope, id, props);

    const { certificateArn, domainName, resourceNamePrefix } = props;

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'Certificate',
      certificateArn
    );

    const s3KmsKey = new kms.Key(this, 'S3Key');

    const certificateBucket = new s3.Bucket(this, 'CertificateBucket', {
      bucketName: `${resourceNamePrefix}-certificate`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
    });

    new s3deploy.BucketDeployment(this, 'CertificateDeployment', {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, '../data/certificate')),
      ],
      destinationBucket: certificateBucket,
      destinationKeyPrefix: domainName,
    });

    const logGroup = new logs.LogGroup(this, 'ProductApiAccessLogGroup', {
      logGroupName: `/aws/apigateway/${resourceNamePrefix}-api`,
      retention: logs.RetentionDays.ONE_YEAR,
    });

    const api = new apigw.RestApi(this, 'ApiGatewayProductApi', {
      restApiName: `${resourceNamePrefix}-api`,
      endpointTypes: [apigw.EndpointType.REGIONAL],
      deployOptions: {
        stageName: APIGW_STAGE_NAME,
        tracingEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        accessLogDestination: new apigw.LogGroupLogDestination(logGroup),
      },
      domainName: {
        domainName,
        certificate,
        endpointType: apigw.EndpointType.REGIONAL,
        securityPolicy: apigw.SecurityPolicy.TLS_1_2,
        mtls: {
          bucket: certificateBucket,
          key: `${domainName}/truststore.pem`,
        },
      },
      // Disable `execute-api` endpoint to ensure that clients can access the API only by using a custom domain name with mutual TLS.
      // disableExecuteApiEndpoint: true,
    });

    const mockIntegration = new apigw.MockIntegration({
      integrationResponses: [
        {
          statusCode: '200',
          responseTemplates: {
            'application/json': JSON.stringify({ message: 'ok' }),
          },
        },
      ],
      passthroughBehavior: apigw.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': JSON.stringify({ statusCode: 200 }),
      },
    });

    api.root.addMethod('ANY', mockIntegration, {
      methodResponses: [{ statusCode: '200' }],
    });
  }
}
