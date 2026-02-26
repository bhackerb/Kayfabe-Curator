# Kayfabe Curator

React + Vite frontend with an Express backend for YouTube discovery.

## Local development

Prerequisites: Node.js 20+

1. Install dependencies:
   `npm install`
2. Copy environment values:
   `cp .env.example .env`
3. Set `YOUTUBE_API_KEY` in `.env`.
4. Start the app:
   `npm run dev`
5. Open `http://localhost:8080`.

## Build and run with Docker

```bash
docker build -t kayfabe-curator .
docker run --rm -p 8080:8080 -e YOUTUBE_API_KEY=your_key_here kayfabe-curator
```

## Deploy with Cloud Build + Cloud Run

1. Create an Artifact Registry repo (once):
   `gcloud artifacts repositories create kayfabe-curator --repository-format=docker --location=us-central1`
2. Create a secret (once):
   `echo -n "your_youtube_api_key" | gcloud secrets create YOUTUBE_API_KEY --data-file=-`
3. Submit build from this folder:
   `gcloud builds submit --config cloudbuild.yaml`

The build config will:
- Build and push a container image.
- Deploy Cloud Run service `kayfabe-curator` in `us-central1`.
- Inject secret `YOUTUBE_API_KEY` into the container.
