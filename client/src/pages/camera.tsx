
import React, { useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { CameraInput } from '@/components/ui/camera-input';

export default function CameraPage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleCapture = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setCapturedImage(imageUrl);
  };

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Camera Test Page
        </Typography>
        <Box sx={{ maxWidth: 500, mx: 'auto' }}>
          <CameraInput onCapture={handleCapture} />
          {capturedImage && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <img src={capturedImage} alt="Captured" style={{ maxWidth: '100%' }} />
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
