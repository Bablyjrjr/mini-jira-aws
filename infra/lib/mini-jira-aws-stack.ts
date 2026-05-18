import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class MiniJiraAwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'MiniJiraVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'Public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: 'Private', subnetType: ec2.SubnetType.PRIVATE_WITH_NAT, cidrMask: 24 },
      ],
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, 'MiniJiraAlb', {
      vpc,
      internetFacing: true,
    });
    const listener = alb.addListener('HttpListener', { port: 80 });

    const asg = new autoscaling.AutoScalingGroup(this, 'MiniJiraAsg', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
      minCapacity: 2,
      maxCapacity: 4,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_NAT },
    });
    listener.addTargets('AppFleet', {
      port: 4000,
      targets: [asg],
      healthCheck: { path: '/api/health', interval: cdk.Duration.seconds(30) },
    });

    const originalBucket = new s3.Bucket(this, 'OriginalBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    const resizedBucket = new s3.Bucket(this, 'ResizedBucket', {
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    const tasksTable = new dynamodb.Table(this, 'TasksTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    tasksTable.addGlobalSecondaryIndex({
      indexName: 'teamId-index',
      partitionKey: { name: 'teamId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });
    tasksTable.addGlobalSecondaryIndex({
      indexName: 'assigneeId-index',
      partitionKey: { name: 'assigneeId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    new dynamodb.Table(this, 'ProjectsTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new dynamodb.Table(this, 'CommentsTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const assignmentTopic = new sns.Topic(this, 'TaskAssignmentTopic');
    const assignmentQueue = new sqs.Queue(this, 'TaskAssignmentQueue', { visibilityTimeout: cdk.Duration.seconds(60) });
    assignmentTopic.addSubscription(new sns_subscriptions.SqsSubscription(assignmentQueue));

    const resizeLambda = new lambda.Function(this, 'ImageResizeFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/image-resize'),
      environment: {
        RESIZED_BUCKET: resizedBucket.bucketName,
      },
    });
    originalBucket.grantRead(resizeLambda);
    resizedBucket.grantPut(resizeLambda);

    const assignmentWorker = new lambda.Function(this, 'AssignmentWorkerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/assignment-worker'),
      environment: {
        ACTIVITY_TABLE: 'MiniJiraActivityLog',
      },
    });
    assignmentQueue.grantConsumeMessages(assignmentWorker);

    const digestLambda = new lambda.Function(this, 'DailyDigestFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/daily-digest'),
      environment: {
        TASK_TABLE: tasksTable.tableName,
      },
    });

    new events.Rule(this, 'DailyDigestRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '9' }),
      targets: [new targets.LambdaFunction(digestLambda)],
    });

    const role = new iam.Role(this, 'Ec2AppRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')],
    });
    tasksTable.grantReadWriteData(role);
    originalBucket.grantReadWrite(role);
    resizedBucket.grantRead(role);
    assignmentTopic.grantPublish(role);

    asg.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    asg.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));
    asg.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
  }
}
