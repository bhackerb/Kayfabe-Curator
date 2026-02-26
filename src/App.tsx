import React, { useState, useEffect } from 'react';
import { Search, Play, Clock, ListVideo, Filter, Menu, X, Plus, Check } from 'lucide-react';
import { PROMOTIONS, Video, ContentType, DateRange } from './types';

export default function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedPromotion, setSelectedPromotion] = useState<string>(PROMOTIONS[0].id);
  const [contentType, setContentType] = useState<ContentType>('highlights');
  const [dateRange, setDateRange] = useState<DateRange>('last_week');
  const [searchQuery, setSearchQuery] = useState('');
  const [wrestlerSearch, setWrestlerSearch] = useState('');
  
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [watchLater, setWatchLater] = useState<Video[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [playlistOpen, setPlaylistOpen] = useState(true);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const promotion = PROMOTIONS.find(p => p.id === selectedPromotion);
      if (!promotion) return;

      let q = '';
      if (contentType === 'reviews') {
        q += ` ${promotion.name} review reaction`;
      }
      
      if (wrestlerSearch) q += ` ${wrestlerSearch}`;
      if (searchQuery) q += ` ${searchQuery}`;

      const params = new URLSearchParams({
        maxResults: '50',
        type: 'video',
        contentType: contentType
      });

      if (contentType !== 'reviews') {
        params.append('channelId', promotion.channelId);
      } else {
        params.append('excludeChannelId', promotion.channelId);
      }

      if (q.trim()) {
        params.append('q', q.trim());
      }

      // Date range logic
      const now = new Date();
      if (dateRange === 'last_week') {
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.append('publishedAfter', lastWeek.toISOString());
      } else if (dateRange === 'last_month') {
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.append('publishedAfter', lastMonth.toISOString());
      }

      const res = await fetch(`/api/youtube/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || data.error || 'Failed to fetch videos');
      }

      const items = data.items || [];
      setVideos(items);
      if (items.length > 0 && !currentVideo) {
        setCurrentVideo(items[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [selectedPromotion, contentType, dateRange]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideos();
  };

  const toggleWatchLater = (video: Video) => {
    setWatchLater(prev => {
      if (prev.find(v => v.id.videoId === video.id.videoId)) {
        return prev.filter(v => v.id.videoId !== video.id.videoId);
      }
      return [...prev, video];
    });
  };

  const isWatchLater = (videoId: string) => {
    return watchLater.some(v => v.id.videoId === videoId);
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Left Sidebar - Filters */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 overflow-y-auto flex flex-col`}>
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-red-500 fill-red-500" />
            WrestleHub
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6 flex-1">
          {/* Promotion Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Promotion</h3>
            <div className="space-y-2">
              {PROMOTIONS.map(promo => (
                <button
                  key={promo.id}
                  onClick={() => setSelectedPromotion(promo.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedPromotion === promo.id 
                      ? 'bg-red-500/10 text-red-500 font-medium border border-red-500/20' 
                      : 'text-zinc-300 hover:bg-zinc-800 border border-transparent'
                  }`}
                >
                  {promo.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content Type */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Content Type</h3>
            <select 
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-red-500"
            >
              <option value="all">Everything</option>
              <option value="highlights">Show Highlights</option>
              <option value="clips">Short Clips</option>
              <option value="full_shows">Full Shows</option>
              <option value="reviews">Reviews & Reactions</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Date Range</h3>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-red-500"
            >
              <option value="last_week">Last 7 Days</option>
              <option value="last_month">Last 30 Days</option>
              <option value="custom">All Time</option>
            </select>
          </div>

          {/* Wrestler Search */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Search Wrestler</h3>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="e.g. Roman Reigns, Kenny Omega..."
                value={wrestlerSearch}
                onChange={(e) => setWrestlerSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-red-500"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            </form>
          </div>
          
          <button 
            onClick={fetchVideos}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="text-zinc-400 hover:text-white">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <form onSubmit={handleSearch} className="relative hidden md:block w-96">
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-4 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2" />
            </form>
          </div>
          
          <button 
            onClick={() => setPlaylistOpen(!playlistOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              playlistOpen ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <ListVideo className="w-4 h-4" />
            <span className="hidden sm:inline">Watch Later ({watchLater.length})</span>
          </button>
        </header>

        {/* Player & Results */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl">
              <p className="font-medium">Error loading videos</p>
              <p className="text-sm opacity-80">{error}</p>
              <p className="text-xs mt-2 text-zinc-400">Make sure you have configured your YOUTUBE_API_KEY in the environment variables.</p>
            </div>
          )}

          {currentVideo ? (
            <div className="space-y-4">
              <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
                <iframe
                  src={`https://www.youtube.com/embed/${currentVideo.id.videoId}?autoplay=0`}
                  title={currentVideo.snippet.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
                    {currentVideo.snippet.title}
                  </h2>
                  <p className="text-zinc-400 mt-1 flex items-center gap-2 text-sm">
                    <span className="font-medium text-zinc-300">{currentVideo.snippet.channelTitle}</span>
                    <span>•</span>
                    <span>{new Date(currentVideo.snippet.publishedAt).toLocaleDateString()}</span>
                  </p>
                </div>
                <button 
                  onClick={() => toggleWatchLater(currentVideo)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isWatchLater(currentVideo.id.videoId)
                      ? 'bg-zinc-800 text-white'
                      : 'bg-zinc-100 text-zinc-900 hover:bg-white'
                  }`}
                >
                  {isWatchLater(currentVideo.id.videoId) ? (
                    <>
                      <Check className="w-4 h-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      Watch Later
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : !loading && !error && (
            <div className="aspect-video w-full bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center text-zinc-500">
              <p>Select a video to play</p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-white mb-4">Results</h3>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="aspect-video bg-zinc-800 rounded-lg"></div>
                    <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                    <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <div 
                    key={video.id.videoId} 
                    className="group cursor-pointer space-y-2"
                    onClick={() => setCurrentVideo(video)}
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-800">
                      <img 
                        src={video.snippet.thumbnails.medium.url} 
                        alt={video.snippet.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-10 h-10 text-white fill-white" />
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchLater(video);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {isWatchLater(video.id.videoId) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-zinc-100 line-clamp-2 group-hover:text-red-400 transition-colors" dangerouslySetInnerHTML={{__html: video.snippet.title}}></h4>
                      <p className="text-xs text-zinc-500 mt-1">{new Date(video.snippet.publishedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : !error && (
              <div className="text-center py-12 text-zinc-500">
                <p>No videos found for these filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Watch Later */}
      <div className={`${playlistOpen ? 'w-80' : 'w-0'} transition-all duration-300 flex-shrink-0 bg-zinc-900 border-l border-zinc-800 overflow-y-auto flex flex-col`}>
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-zinc-400" />
            Watch Later
          </h2>
          <button onClick={() => setPlaylistOpen(false)} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 flex-1">
          {watchLater.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 space-y-3">
              <ListVideo className="w-8 h-8 mx-auto opacity-50" />
              <p className="text-sm">Your watch later list is empty.</p>
              <p className="text-xs">Hover over a video and click the + icon to add it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {watchLater.map((video) => (
                <div 
                  key={video.id.videoId}
                  className={`flex gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    currentVideo?.id.videoId === video.id.videoId ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                  }`}
                  onClick={() => setCurrentVideo(video)}
                >
                  <div className="relative w-32 aspect-video rounded flex-shrink-0 overflow-hidden bg-zinc-800">
                    <img 
                      src={video.snippet.thumbnails.default.url} 
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {currentVideo?.id.videoId === video.id.videoId && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <h4 className="text-xs font-medium text-zinc-200 line-clamp-2 leading-tight" dangerouslySetInnerHTML={{__html: video.snippet.title}}></h4>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchLater(video);
                      }}
                      className="text-xs text-zinc-500 hover:text-red-400 self-start mt-1 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

