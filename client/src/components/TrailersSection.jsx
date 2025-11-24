import React, { useMemo, useState } from "react";
import { dummyTrailers } from "../assets/assets";
import BlurCircle from "./BlurCircle";
import { PlayCircleIcon } from "lucide-react";
import YouTube from "react-youtube"; // ✅ import react-youtube

// ✅ Hàm lấy videoId từ link youtube
const getYoutubeId = (url) => {
  if (!url) return "";
  // dạng watch?v=
  const m1 = url.match(/[?&]v=([^&]+)/);
  if (m1?.[1]) return m1[1];

  // dạng youtu.be/
  const m2 = url.match(/youtu\.be\/([^?&]+)/);
  if (m2?.[1]) return m2[1];

  // dạng embed/
  const m3 = url.match(/embed\/([^?&]+)/);
  if (m3?.[1]) return m3[1];

  return "";
};

const TrailersSection = () => {
  const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0]);

  // ✅ lấy id mỗi khi đổi trailer
  const videoId = useMemo(
    () => getYoutubeId(currentTrailer?.videoUrl),
    [currentTrailer]
  );

  // ✅ cấu hình kích thước + params cho youtube iframe
  const opts = {
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 0,
      rel: 0,
      modestbranding: 1,
      origin: window.location.origin,
    },
  };

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden">
      <p className="text-gray-300 font-medium text-lg max-w-[960px] mx-auto">
        Trailers
      </p>

      {/* ✅ khung video 16:9 */}
      <div
        className="relative mt-6 max-w-[960px] mx-auto rounded-xl overflow-hidden bg-black"
        style={{ aspectRatio: "16/9" }}
      >
        <BlurCircle top="-100px" right="-100px" />

        {videoId ? (
          <YouTube
            videoId={videoId}
            opts={opts}
            className="w-full h-full"
            iframeClassName="w-full h-full"
            onError={(e) => console.log("YouTube error", e)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Không lấy được videoId
          </div>
        )}
      </div>

      {/* ✅ thumbnails dưới giữ nguyên */}
      <div className="group grid grid-cols-4 gap-4 md:gap-8 mt-8 max-w-3xl mx-auto">
        {dummyTrailers.map((t) => (
          <div
            key={t.image}
            className="relative group-hover:not-hover:opacity-50 hover:-translate-y-1 duration-300 transition max-md:h-60 md:max-h-60 cursor-pointer"
            onClick={() => setCurrentTrailer(t)}
          >
            <img
              src={t.image}
              alt="trailers"
              className="rounded-lg w-full h-full object-cover brightness-75"
            />
            <PlayCircleIcon
              strokeWidth={1.6}
              className="absolute top-1/2 left-1/2 w-5 md:w-8 h-5 md:h-12 transform -translate-x-1/2 -translate-y-1/2"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrailersSection;
