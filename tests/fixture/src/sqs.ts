import * as _ from "lodash";
import * as fs from "fs";
import * as sqs from "aws-cdk-lib/aws-sqs";

fs.existsSync("nothing");

class Queue extends sqs.Queue {}

export default _.merge(sqs, { Queue });
