import * as _ from "lodash";
import * as fs from "fs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { constructs } from ".";

fs.existsSync("nothing");

export interface QueueProps extends sqs.QueueProps {
  enableSSL?: boolean;
}

export class Queue extends sqs.Queue {
  constructor(scope: constructs.IConstruct, id: string, props: QueueProps = {}) {
    delete props.enableSSL;
    super(scope, id, props);
  }
}

export default _.merge(sqs, { Queue });
