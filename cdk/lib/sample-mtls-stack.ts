import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';

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

    const s3CertificateBucket = new s3.Bucket(this, 'Certificate', {
      bucketName: `${resourceNamePrefix}-certificate`,
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
      // domainName: {
      //   domainName,
      //   certificate,
      //   endpointType: apigw.EndpointType.REGIONAL,
      //   securityPolicy: apigw.SecurityPolicy.TLS_1_2,
      //   mtls: {
      //     bucket: s3CertificateBucket,
      //     key: `${domainName}/truststore.pem`,
      //   },
      // },
      // Disable `execute-api` endpoint to ensure that clients can access the API only by using a custom domain name with mutual TLS.
      // disableExecuteApiEndpoint: true,
    });

    const mockIntegration = new apigw.MockIntegration({
      integrationResponses: [{ statusCode: '200' }],
      passthroughBehavior: apigw.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{ "statusCode": 200 }',
      },
    });

    api.root.addMethod('ANY', mockIntegration, {
      methodResponses: [{ statusCode: '200' }],
    });
  }
}
