# Vendor Tracker

A full-stack serverless vendor management application built with **Next.js, TypeScript, AWS CDK, AWS Lambda, DynamoDB, Amazon Cognito, API Gateway, S3, and CloudFront**.

The project demonstrates how to build and deploy a secure, scalable CRUD application on AWS using **Infrastructure as Code (IaC)** with AWS CDK.

## 🚀 Features

* 🔐 User authentication with **Amazon Cognito**
* 🔑 JWT-based authorization for protected API endpoints
* ➕ Create vendor records
* 📋 View vendor records
* 🗑️ Delete vendor records
* ⚡ Serverless backend using AWS Lambda
* 🗄️ Vendor data stored in Amazon DynamoDB
* 🌐 REST API using Amazon API Gateway
* ☁️ Frontend hosting with Amazon S3 and CloudFront
* 🏗️ AWS infrastructure defined using **AWS CDK**
* 📦 TypeScript-based frontend and backend
* 🔒 Protected API routes with Cognito authorization

## 🏗️ Architecture

```text
                    ┌─────────────────┐
                    │     Browser     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   CloudFront    │
                    │  + S3 Frontend  │
                    └────────┬────────┘
                             │
                             │ API Requests
                             ▼
                    ┌─────────────────┐
                    │  API Gateway    │
                    │  REST API       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Cognito Authorizer│
                    │   JWT Validation │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     Lambda      │
                    │ Node.js/TS      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    DynamoDB     │
                    │  Vendor Table   │
                    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* AWS Amplify
* `@aws-amplify/ui-react`

### Backend

* AWS Lambda
* Node.js
* TypeScript
* Amazon API Gateway
* Amazon DynamoDB

### Authentication

* Amazon Cognito
* JWT Authentication
* Cognito Authorizer

### AWS Infrastructure

* AWS CDK
* Amazon S3
* Amazon CloudFront
* IAM
* API Gateway
* Lambda
* DynamoDB
* Cognito

### Build

* esbuild
* AWS CDK `NodejsFunction`

## 📁 Project Structure

```text
Vendor-Tracker/
│
├── backend/
│   ├── lambda/
│   │   ├── createVendor.ts
│   │   └── getVendors.ts
│   │
│   ├── lib/
│   │   └── backend-stack.ts
│   │
│   ├── cdk.json
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   └── providers.tsx
│   │
│   ├── lib/
│   │   └── api.ts
│   │
│   ├── types/
│   │   └── vendor.ts
│   │
│   ├── next.config.js
│   └── package.json
│
└── README.md
```

## 🔄 Application Flow

1. User opens the Vendor Tracker application.
2. User signs up or signs in using Amazon Cognito.
3. Cognito authenticates the user and provides a JWT token.
4. The frontend retrieves the authentication session using AWS Amplify.
5. The JWT token is included in the `Authorization` header for protected API requests.
6. API Gateway validates the JWT using the Cognito Authorizer.
7. Valid requests are forwarded to AWS Lambda.
8. Lambda performs the required operation on DynamoDB.
9. The response is returned through API Gateway to the frontend.

```text
User
  ↓
Cognito Login
  ↓
JWT Token
  ↓
Next.js Frontend
  ↓
API Gateway
  ↓
Cognito JWT Validation
  ↓
Lambda
  ↓
DynamoDB
```

## 🔐 Authentication & Authorization

Amazon Cognito is used to manage user authentication.

Protected API requests include a JWT token:

```http
Authorization: Bearer <JWT_TOKEN>
```

API Gateway validates the token before allowing the request to reach Lambda.

If the token is missing, invalid, or expired:

```http
401 Unauthorized
```

This prevents unauthorized users from accessing protected API operations.

> Note: The GET `/vendors` endpoint is intentionally left public in the current learning implementation. POST and DELETE operations require authentication.

## 📡 API Endpoints

| Method   | Endpoint        | Description      | Authentication |
| -------- | --------------- | ---------------- | -------------- |
| `GET`    | `/vendors`      | Retrieve vendors | Public*        |
| `POST`   | `/vendors`      | Create a vendor  | Required       |
| `DELETE` | `/vendors/{id}` | Delete a vendor  | Required       |

*The GET endpoint can also be protected through the Cognito authorizer if required.

## ⚙️ Prerequisites

Before running the project, install:

* Node.js 18+
* npm 9+
* AWS CLI
* AWS CDK v2
* An AWS account

Verify Node.js:

```bash
node --version
```

Verify npm:

```bash
npm --version
```

Verify AWS CLI:

```bash
aws --version
```

Verify CDK:

```bash
cdk --version
```

## 🔑 Configure AWS CLI

Configure your AWS credentials:

```bash
aws configure
```

You will be prompted for:

```text
AWS Access Key ID
AWS Secret Access Key
Default region name
Default output format
```

Make sure the AWS identity you're using has sufficient permissions to deploy the required resources.

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/Vendor-Tracker.git
cd Vendor-Tracker
```

### Install backend dependencies

```bash
cd backend
npm install
```

### Install frontend dependencies

```bash
cd ../frontend
npm install
```

## 🌎 Environment Configuration

Create:

```text
frontend/.env.local
```

Add your deployed API Gateway URL:

```env
NEXT_PUBLIC_API_URL=https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod
```

Configure your Cognito User Pool details in:

```text
frontend/app/providers.tsx
```

Example:

```typescript
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "YOUR_USER_POOL_ID",
      userPoolClientId: "YOUR_USER_POOL_CLIENT_ID",
    },
  },
});
```

> Never commit AWS access keys, secret keys, passwords, or other sensitive credentials to GitHub.

## ☁️ AWS Deployment

### 1. Bootstrap AWS CDK

From the backend directory:

```bash
cd backend
cdk bootstrap
```

CDK bootstrap is generally required once per AWS account and region.

### 2. Build the frontend

From the frontend directory:

```bash
cd frontend
npm run build
```

This generates the static frontend output.

### 3. Deploy the AWS infrastructure

From the backend directory:

```bash
cd backend
cdk deploy
```

Review the resources and confirm the deployment when prompted.

### Resources Created

The CDK stack provisions resources including:

* Amazon DynamoDB table
* AWS Lambda functions
* Amazon API Gateway REST API
* Amazon Cognito User Pool
* Cognito App Client
* S3 bucket
* CloudFront distribution
* IAM roles and policies

After deployment, CDK provides outputs such as:

```text
ApiEndpoint
UserPoolId
UserPoolClientId
CloudFrontURL
```

Use these values to configure the frontend.

## 💻 Run Locally

Start the Next.js development server:

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:3000
```

The frontend can run locally while communicating with the deployed AWS backend.

## 🧪 Testing the API

You can test the API using tools such as:

* Postman
* Browser DevTools
* curl

Example:

```bash
curl https://YOUR_API_URL/vendors
```

For protected endpoints, include the JWT:

```bash
curl -X POST https://YOUR_API_URL/vendors \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Example Vendor"}'
```

## 🐛 Troubleshooting

### 502 Bad Gateway

If a Lambda request returns `502 Bad Gateway`, check the Lambda logs in **Amazon CloudWatch**.

Common causes include:

* Incorrect Lambda handler path
* Missing environment variables
* Runtime errors
* Incorrect DynamoDB permissions

### 401 Unauthorized

Check:

* The JWT token is being sent.
* The `Authorization` header is present.
* The token has not expired.
* The Cognito User Pool configuration is correct.
* The API Gateway Cognito authorizer is configured correctly.

### Cognito User Stuck as Unconfirmed

If email verification is enabled, the user must confirm their email before signing in.

For development testing, users can be manually confirmed through the Cognito console.

## 🧹 Cleanup

To remove the AWS resources created by the project:

```bash
cd backend
cdk destroy
```

This helps prevent unnecessary AWS charges.

> **Important:** Destroying the stack can permanently delete project data depending on the configured removal policies. Do not use destructive removal policies for production databases containing important data.

## 🎯 Learning Objectives

This project was built to gain practical experience with:

* React/Next.js development
* REST API development
* Serverless architecture
* AWS Lambda
* Amazon DynamoDB
* Amazon Cognito
* API Gateway authorization
* JWT authentication
* AWS CDK
* Infrastructure as Code
* S3 and CloudFront deployment
* IAM permissions
* CloudWatch debugging
* AWS application deployment

## 🔮 Future Improvements

Possible improvements include:

* [ ] Protect the GET `/vendors` endpoint
* [ ] Add vendor update functionality
* [ ] Add vendor search and filtering
* [ ] Add pagination
* [ ] Add input validation
* [ ] Add automated unit and integration tests
* [ ] Add CI/CD with GitHub Actions
* [ ] Add CloudWatch monitoring and alarms
* [ ] Add DynamoDB indexes for advanced queries
* [ ] Improve error handling and user notifications

## 📌 Project Purpose

This project is primarily a **learning and portfolio project** demonstrating how a modern React application can be connected to a serverless AWS backend using Infrastructure as Code.

It is designed to demonstrate practical knowledge of **React/Next.js, Node.js/TypeScript, REST APIs, authentication, AWS services, and cloud deployment**.

## 📄 License

This project is licensed under the **MIT License**.

---

⭐ If you find this project useful, feel free to star the repository.
