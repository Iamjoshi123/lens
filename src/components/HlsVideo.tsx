"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
// We need to import Hls type dynamically or use any if the library isn't installed for compilation check
import Hls from "hls.js";

interface HlsVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    src: string;
    onReady?: () => void;
}

const HlsVideo = forwardRef<HTMLVideoElement, HlsVideoProps>(({ src, onReady, ...props }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Cleanup previous HLS instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        const isHls = src.includes(".m3u8");

        if (isHls && Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
            });
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (onReady) onReady();
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            hls.on(Hls.Events.ERROR, (event: any, data: any) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            break;
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            video.src = src;
            video.addEventListener('loadedmetadata', () => {
                if (onReady) onReady();
            });
        } else {
            // Standard video (MP4/WebM)
            video.src = src;
            if (onReady) {
                video.addEventListener('canplay', onReady, { once: true });
            }
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [src, onReady]);

    return (
        <video
            ref={videoRef}
            {...props}
        />
    );
});

HlsVideo.displayName = "HlsVideo";

export default HlsVideo;
