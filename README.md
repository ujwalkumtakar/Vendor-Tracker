# Vendor Tracker - Full-Stack AWS App with React and CDK

A full-stack vendor management application built with Next.js, AWS CDK, Lambda, DynamoDB, and Cognito. Built as a learning reference for frontend developers transitioning into cloud and serverless development.

<!-- > **Full tutorial:** [Insert article title + link] -->

---

## Project Overview

Vendor Tracker is a CRUD application that lets authenticated users create, read, and delete vendor records stored in DynamoDB. The entire backend infrastructure is defined as TypeScript code using AWS CDK and deploys with a single command.

**Who this is for:**
Frontend developers who understand React and want a concrete, working example of a serverless AWS backend, with authentication, that they can clone, deploy, and modify.

**Core features:**
- Create, read, and delete vendor records
- JWT-based authentication via Amazon Cognito
- Protected API routes - unauthenticated requests are rejected at the API Gateway level
- Infrastructure defined as code (no clicking through the AWS Console to deploy)
- Frontend deployed to CloudFront with HTTPS out of the box

---

## Architecture Overview

```
Browser → CloudFront → API Gateway → Lambda → DynamoDB
                            ↑
                         Cognito
                      (JWT Validation)
```

The React frontend is served through CloudFront as a static export. API requests go through API Gateway, which validates the user's Cognito JWT token before routing the request to the appropriate Lambda function. Lambda reads and writes to a DynamoDB table. Unauthenticated requests are rejected before they reach Lambda.

For a full explanation of each layer, the request lifecycle, and the reasoning behind infrastructure decisions, see the complete tutorial: [How to Build a Full-Stack CRUD App with React, AWS Lambda, DynamoDB, and Cognito Auth](https://www.freecodecamp.org/news/full-stack-aws-react-lambda-dynamodb-tutorial)]

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (TypeScript, Tailwind CSS) |
| Auth UI | AWS Amplify (`aws-amplify`, `@aws-amplify/ui-react`) |
| Infrastructure | AWS CDK (TypeScript) |
| API | Amazon API Gateway (REST) |
| Server logic | AWS Lambda (Node.js 18.x, via `NodejsFunction`) |
| Database | Amazon DynamoDB |
| Authentication | Amazon Cognito (User Pool) |
| Hosting | Amazon S3 + Amazon CloudFront |
| Bundler | esbuild (via CDK `NodejsFunction`) |

---

## Prerequisites

Before you begin, ensure you have the following installed and configured:

- **Node.js** v18 or later
- **npm** v9 or later
- An **AWS account** ([create one here](https://aws.amazon.com))
- **AWS CLI** installed and configured with a user that has `AdministratorAccess`

```bash
# Verify AWS CLI is installed
aws --version

# Configure with your IAM credentials
aws configure
```

- **AWS CDK** v2 installed globally

```bash
npm install -g aws-cdk

# Verify
cdk --version
```

> If you haven't set up your IAM user or AWS CLI credentials yet, the tutorial covers this in detail: [How to Build a Full-Stack CRUD App with React, AWS Lambda, DynamoDB, and Cognito Auth](https://www.freecodecamp.org/news/full-stack-aws-react-lambda-dynamodb-tutorial)

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/BenedictaUche/vendor-tracker.git
cd vendor-tracker
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Environment variables

The frontend requires your deployed API Gateway URL and Cognito IDs. These are output by `cdk deploy` (see Deployment Steps below).

Create a file at `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
```

Cognito IDs are configured directly in `frontend/app/providers.tsx`:

```typescript
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_xxxxxxxxx',
      userPoolClientId: 'xxxxxxxxxxxxxxxxxxxx',
    }
  }
}, { ssr: true });
```

### 5. Run the frontend locally

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:3000`. Note that the backend must be deployed to AWS before the frontend can create or retrieve vendors — there is no local emulation of Lambda or DynamoDB in this setup.

---

## Deployment Steps

### Step 1: Bootstrap your AWS environment

This is a one-time setup per AWS account and region. It creates the S3 bucket CDK uses to stage assets before deployment.

```bash
cd backend
cdk bootstrap
```

### Step 2: Build the frontend

The CDK stack copies the built frontend files to S3 during deployment. Build them first:

```bash
cd frontend
npm run build
```

This generates a static export in `frontend/out/`.

### Step 3: Deploy the stack

```bash
cd backend
cdk deploy
```

CDK will display a summary of resources it is about to create and prompt for confirmation. Type `y` to proceed.

**Resources created by this deployment:**

- DynamoDB table (`VendorTable`)
- Lambda functions (`createVendor`, `getVendors`)
- API Gateway REST API with `/vendors` resource (GET, POST, DELETE)
- Cognito User Pool and App Client
- Cognito domain prefix
- S3 bucket for frontend assets
- CloudFront distribution
- IAM roles and policies for each Lambda

### Step 4: Note the outputs

After deployment, the terminal will display:

```
Outputs:
VendorStack.ApiEndpoint         = https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/
VendorStack.UserPoolId          = us-east-1_xxxxxxxxx
VendorStack.UserPoolClientId    = xxxxxxxxxxxxxxxxxxxx
VendorStack.CloudFrontURL       = xxxxxxxxxx.cloudfront.net
```

Copy these values into `frontend/app/providers.tsx` and `frontend/.env.local`, then rebuild and redeploy if you are hosting the frontend via CloudFront.

---

## Project Structure

```
vendor-tracker/
├── backend/
│   ├── lambda/
│   │   ├── createVendor.ts     # POST handler — writes vendor to DynamoDB
│   │   └── getVendors.ts       # GET handler — scans and returns all vendors
│   ├── lib/
│   │   └── backend-stack.ts    # CDK stack — all infrastructure defined here
│   ├── cdk.json
│   └── package.json
│
└── frontend/
    ├── app/
    │   ├── page.tsx            # Main page — vendor form and list
    │   └── providers.tsx       # Amplify configuration
    ├── lib/
    │   └── api.ts              # API service layer — all fetch calls live here
    ├── types/
    │   └── vendor.ts           # Vendor TypeScript interface
    ├── next.config.js          # Static export configuration
    └── package.json
```

**Key files to understand first:**

- `backend/lib/backend-stack.ts` — the single source of truth for all AWS infrastructure. Read this alongside the tutorial to understand how CDK constructs map to real AWS resources.
- `frontend/lib/api.ts` — all communication with the backend. Auth token retrieval and `fetch` calls are centralised here.
- `frontend/app/providers.tsx` — Amplify configuration. Your Cognito IDs go here.

---

## Authentication Flow

1. The user signs in through the Amplify UI (`withAuthenticator` HOC)
2. Cognito validates the credentials and returns a JWT Identity Token
3. Amplify stores the token in browser storage
4. On every protected API call, `fetchAuthSession()` retrieves the token
5. The token is attached to the `Authorization` header of the request
6. API Gateway's Cognito Authorizer validates the token before the request reaches Lambda
7. If the token is missing or expired, API Gateway returns `401 Unauthorized` — Lambda is never invoked

The GET endpoint (`getVendors`) is intentionally left unprotected in this reference implementation. The POST and DELETE endpoints require a valid token. To protect all endpoints, apply the authorizer to the GET method in `backend-stack.ts` following the same pattern used for POST.

---

## Common Issues

**502 Bad Gateway on POST /vendors**

The Lambda is crashing before it can respond. The most common cause is a missing `TABLE_NAME` environment variable or an incorrect handler path in the CDK stack. Open CloudWatch → Log Groups → find your Lambda's log group → read the most recent log stream for the exact error.

Full diagnosis steps and the fix are documented here: [Insert troubleshooting article title + link].

---

**User stuck as "Unconfirmed" after sign-up**

Cognito requires email verification before allowing login. During development, you can manually confirm a user in the AWS Console: Cognito → User Pools → Users → select the user → Actions → Confirm Account.

To avoid this during testing, ensure `autoVerify: { email: true }` is set on the `UserPool` construct in `backend-stack.ts`.

---

**401 Unauthorized after deployment**

Verify two things: the `Authorization` header is present on the request (check Chrome DevTools → Network → Request Headers), and `authorizationType: apigateway.AuthorizationType.COGNITO` is set on each protected method in the CDK stack.

---

## Cleanup

To remove all AWS resources created by this project and avoid ongoing charges:

```bash
cd backend
cdk destroy
```

CDK will prompt for confirmation before deleting. The S3 bucket and DynamoDB table are configured with `RemovalPolicy.DESTROY` and `autoDeleteObjects: true` for development convenience. They will be permanently deleted along with all data.

> This removal policy is intentional for a learning project. Change it to `RemovalPolicy.RETAIN` in `backend-stack.ts` before using this in any environment with real data.

<!-- ---

## Full Tutorial

This repository is the reference implementation for the tutorial:

**[[Build a Fullstack vendor management app using React, AWS and CDK](https://techwriterb.medium.com/build-a-full-stack-vendor-management-app-using-react-aws-and-cdk-51941832c566)]**

The article covers every step from AWS account setup through CDK deployment, authentication, and CloudFront hosting, with explanations of each architectural decision. -->
