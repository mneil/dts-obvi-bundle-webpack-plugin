import * as _ from "lodash";
import * as sqs from "aws-cdk-lib/aws-sqs";

class Queue extends sqs.Queue {}

export default _.merge(sqs, { Queue });
