# 🎨 Gerador de Imagens (AI Image Generator)

A specialized AI-powered application designed to create engaging social media carousels. This project leverages the power of **Google Gemini** for content planning and **Google Vertex AI (Imagen 3.0)** for high-quality image generation, orchestrated through a robust serverless architecture.

## 🚀 Key Features

- **AI Content Planning**: Automatically generates carousel outlines (slides, text, and image prompts) from a simple user topic using Gemini 2.5 Flash.
- **High-Fidelity Image Generation**: Uses Google's state-of-the-art Imagen 3.0 model to create stunning visuals for each slide.
- **Asynchronous Architecture**: Decouples the heavy lifting of image generation using AWS SQS and Lambda, ensuring a snappy and responsive user experience.
- **Secure Authentication**: Integrated with Clerk for robust user management and route protection.
- **Modern UI/UX**: Built with Next.js 15 and Tailwind CSS for a sleek, responsive, and accessible interface.
- **Cost-Optimized**: Designed with a "scale-to-zero" serverless philosophy using Vercel and AWS Free Tier services.

## 🛠️ Technology Stack

### Frontend & API
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Auth**: Clerk

### Artificial Intelligence
- **Planning**: Google Gemini 2.5 Flash
- **Images**: Google Vertex AI (Imagen 3.0)

### Cloud Infrastructure (AWS)
- **Queue**: Amazon Simple Queue Service (SQS) - Decouples API from Worker.
- **Worker**: AWS Lambda - Processes image generation jobs.
- **Database**: Amazon DynamoDB - Stores job status and image URLs.

### CI/CD
- **Pipeline**: GitHub Actions (Lint, Type Check, Test, Build, Auto-Release).

## 🏗️ Architecture Overview

1.  **User submits a topic** via the Next.js Frontend.
2.  **API Route (`/api/gemini/plan`)** calls Gemini to generate a carousel plan.
3.  **User confirms** the plan.
4.  **API Route (`/api/queue/create-job`)** saves the job to **DynamoDB** (status: PENDING) and pushes a message to **SQS**.
5.  **AWS Lambda Worker** picks up the message from SQS.
6.  **Worker** calls **Vehicle AI** to generate the image.
7.  **Worker** updates **DynamoDB** with the image URL and status (COMPLETED).
8.  **Frontend** polls for status updates and displays the final images.

## 🏁 Getting Started

### Prerequisites
- Node.js 20+ installed.
- **Google Cloud Platform** project with Vertex AI API enabled.
- **AWS Account** with SQS, DynamoDB, and IAM permissions.
- **Clerk** account for authentication.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/gerador-de-imagens.git
    cd gerador-de-imagens
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables:**
    Create a `.env.local` file in the root directory:

    ```env
    # Clerk Auth
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
    CLERK_SECRET_KEY=sk_test_...

    # Google Cloud (Vertex AI)
    GCP_PROJECT_ID=your-gcp-project-id
    GCP_LOCATION=us-central1

    # AWS Configuration
    AWS_REGION=us-east-1
    AWS_ACCESS_KEY_ID=your-aws-access-key
    AWS_SECRET_ACCESS_KEY=your-aws-secret-key
    SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/your-queue-name
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the app.

### Setting up the Worker (Local Dev)

To test the worker locally (processing SQS messages), you can run the worker script manually or use a local trigger. The code is located in the `worker/` directory.

```bash
cd worker
npm install
# Ensure AWS env vars are set in your terminal or a .env file inside worker/
node index.js
```
*Note: The actual worker is designed to run as an AWS Lambda function triggered by SQS.*

## 🧪 Testing

Run the test suite to ensure everything is working correctly:

```bash
npm run test
```

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License.
