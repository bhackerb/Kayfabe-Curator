export interface Video {
  id: {
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    channelTitle: string;
  };
}

export interface Promotion {
  id: string;
  name: string;
  channelId: string;
}

export const PROMOTIONS: Promotion[] = [
  { id: "wwe", name: "WWE", channelId: "UCJ5v_MCY6GNUBTO8-D3XoAg" },
  { id: "aew", name: "AEW", channelId: "UCFN4JkGP_bVhAdBsoV9xftA" },
  { id: "tna", name: "TNA Wrestling", channelId: "UCOp8wkVqdrWbFYHjDv946QQ" },
  { id: "njpw", name: "NJPW", channelId: "UC1lgJkpCx_0SMzsvrTCdxPw" },
];

export type ContentType = "all" | "highlights" | "clips" | "full_shows" | "reviews";
export type DateRange = "last_week" | "last_month" | "custom";
