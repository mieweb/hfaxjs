// Type definitions for Fastify-HylaFax Gateway

import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export interface Sender {
  name: string;
  email?: string;
  id?: string;
}

export interface Recipient {
  name?: string;
  faxNumber: string;
}

export interface FaxContent {
  type: 'text' | 'markdown' | 'html';
  data: string;
}

export interface SendFaxRequest {
  sender: Sender;
  recipient: Recipient;
  content: FaxContent;
  callbackUrl?: string;
}

export interface SendFaxResponse {
  success: boolean;
  jobId: string;
  message: string;
}

export interface StatusUpdateRequest {
  jobId: string;
  status: 'pending' | 'sending' | 'success' | 'busy' | 'failed' | 'no_answer' | 'rejected';
  pages?: number;
  timestamp?: string;
  message?: string;
}

export interface StatusUpdateResponse {
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  success: boolean;
  error: string;
  message: string;
}

export interface FaxStatusResponse {
  jobId: string;
  status: string;
  recipient: Recipient;
  created: string;
  updated: string;
}

export interface HylaFAXConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  useSSL?: boolean;
  defaultResolution?: 'low' | 'medium' | 'high';
  defaultPriority?: number;
}

export interface FaxSendOptions {
  highRes?: boolean;
  lowRes?: boolean;
  priority?: number;
  killtime?: string;
  notifyType?: 'none' | 'done' | 'requeue' | 'done+requeue';
  notifyAddr?: string;
  subject?: string;
  comments?: string;
  coverpage?: boolean;
}

export interface HylafaxGatewayOptions {
  fastify?: Object;
  hylafax?: HylafaxConfig;
  port?: number;
  host?: string;
  apiKeys?: string[];
  maxRetries?: number;
  logLevel?: string;
  maxFileSize?: number;
  enableSwagger?: boolean;
  cors?: {
    origin?: string | boolean;
  };
  storageDir?: string;
}

export interface HylafaxGatewayInstance extends FastifyInstance {
  routes: Array<any>;
}

export function createHylaFaxGateway(options?: HylafaxGatewayOptions): HylafaxGatewayInstance;

export namespace faxSchemas {
  const sendFaxRequest: object;
  const sendFaxResponse: object;
  const statusUpdateRequest: object;
  const statusUpdateResponse: object;
  const errorResponse: object;
}

export function convertToFaxableFormat(
  content: FaxContent, 
  jobId: string, 
  storageDir: string
): Promise<string>;

export function sendToHylafax(params: {
  faxNumber: string;
  filePath: string;
  config: HylaFAXConfig;
  options?: FaxSendOptions;
}): Promise<string>;

export function getJobQueue(config: HylaFAXConfig): Promise<Array<{
  jobId: string;
  priority: string;
  status: string;
  owner: string;
  number: string;
  pages: number;
  dials: number;
  timeToSend: string;
  statusMessage: string;
}>>

export function parseHylafaxStatus(statusInfo: StatusUpdateRequest): {
  jobId: string;
  status: string;
  timestamp: string;
  pages: number;
  message: string;
};

export function queryJobStatus(
  jobId: string,
  config: HylafaxConfig
): Promise<{
  jobId: string;
  status: string;
  message: string;
  timestamp: string;
}>;

export default { createHylaFaxGateway };
