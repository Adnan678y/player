import React from 'react';
import VideoPlayer from './components/VideoPlayer';

function App() {
  // Get the URL parameter
  const params = new URLSearchParams(window.location.search);
  const videoUrl = params.get('url') || '';
  
  // Handle URL construction more carefully
  const fullUrl = videoUrl.startsWith('http') 
    ? videoUrl 
    : videoUrl.startsWith('/') 
      ? `https://myplayer.com${videoUrl}`
      : `https://myplayer.com/${videoUrl}`;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {videoUrl ? (
        <VideoPlayer src={fullUrl} />
      ) : (
        <div className="text-center">
          <h1 className="text-red-500 text-2xl font-bold mb-4">Invalid URL</h1>
          <p className="text-white mb-2">Please provide a valid video URL using the 'url' parameter.</p>
          <p className="text-sm text-red-400">Example: ?url=https://example.com/test.m3u8</p>
        </div>
      )}
    </div>
  );
}

export default App;