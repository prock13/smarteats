
import React, { useRef, useState } from 'react';
import { Button } from './button';
import { Box } from '@mui/material';

interface CameraInputProps {
  onCapture: (file: File) => void;
}

export function CameraInput({ onCapture }: CameraInputProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
          onCapture(file);
        }
      }, 'image/jpeg');

      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline
        style={{ display: isStreaming ? 'block' : 'none', maxWidth: '100%' }}
      />
      {!isStreaming ? (
        <Button onClick={startCamera}>Open Camera</Button>
      ) : (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button onClick={takePhoto}>Take Photo</Button>
          <Button variant="outline" onClick={stopCamera}>Cancel</Button>
        </Box>
      )}
    </Box>
  );
}
