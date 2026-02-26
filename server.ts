import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/youtube/search", async (req, res) => {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "YOUTUBE_API_KEY is not configured" });
      }

      const { q, channelId, excludeChannelId, publishedAfter, publishedBefore, maxResults, type, contentType } = req.query;
      
      const params = new URLSearchParams({
        part: "snippet",
        key: apiKey,
        maxResults: (maxResults as string) || "50",
        type: (type as string) || "video",
        order: "date",
      });

      if (q) params.append("q", q as string);
      if (channelId) params.append("channelId", channelId as string);
      if (publishedAfter) params.append("publishedAfter", publishedAfter as string);
      if (publishedBefore) params.append("publishedBefore", publishedBefore as string);

      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("YouTube API Error:", errorData);
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return res.json(data);
      }

      let filteredItems = data.items;

      // For reviews, we need to filter by title and channel subscriber count
      if (contentType === 'reviews') {
        filteredItems = filteredItems.filter((item: any) => {
          const title = (item.snippet?.title || "").toLowerCase();
          const cId = item.snippet?.channelId;
          return cId !== excludeChannelId && (title.includes('reaction') || title.includes('review'));
        });

        const channelIds = [...new Set(filteredItems.map((item: any) => item.snippet?.channelId).filter(Boolean))].join(',');
        if (channelIds) {
          const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds}&key=${apiKey}`);
          const channelData = await channelResponse.json();
          
          const validChannels = new Set<string>();
          if (channelData.items) {
            for (const channel of channelData.items) {
              const subCount = parseInt(channel.statistics?.subscriberCount || '0', 10);
              if (subCount >= 50000) {
                validChannels.add(channel.id);
              }
            }
          }
          
          filteredItems = filteredItems.filter((item: any) => validChannels.has(item.snippet?.channelId));
        }
      }

      // Fetch precise durations for the returned videos if needed
      if (['highlights', 'clips', 'full_shows'].includes(contentType as string)) {
        const videoIds = filteredItems.map((item: any) => item.id.videoId).filter(Boolean).join(',');
        if (videoIds) {
          const videoResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`);
          const videoData = await videoResponse.json();

          const durationMap = new Map<string, number>();
          const titleMap = new Map<string, string>();

          if (videoData.items) {
            for (const item of videoData.items) {
              const durationStr = item.contentDetails?.duration || "PT0S";
              durationMap.set(item.id, parseDuration(durationStr));
              titleMap.set(item.id, (item.snippet?.title || "").toLowerCase());
            }
          }

          if (contentType === 'highlights') {
            filteredItems = filteredItems.filter((item: any) => {
              const videoId = item.id.videoId;
              const duration = durationMap.get(videoId) || 0;
              const title = titleMap.get(videoId) || '';
              return title.includes('highlights') && duration >= 360; // at least 6 minutes
            });
          } else if (contentType === 'clips') {
            filteredItems = filteredItems.filter((item: any) => {
              const videoId = item.id.videoId;
              const duration = durationMap.get(videoId) || 0;
              return duration < 360; // under 6 minutes
            });
          } else if (contentType === 'full_shows') {
            filteredItems = filteredItems.filter((item: any) => {
              const videoId = item.id.videoId;
              const duration = durationMap.get(videoId) || 0;
              return duration >= 2700; // 45 minutes
            });
          }
        }
      }

      data.items = filteredItems;
      res.json(data);
    } catch (error) {
      console.error("Error fetching from YouTube:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
