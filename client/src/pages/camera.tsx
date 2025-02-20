
import React, { useState } from 'react';
import { Box, Container, Typography, CircularProgress } from '@mui/material';
import { CameraInput } from '@/components/ui/camera-input';
import { apiRequest } from '@/lib/queryClient';

interface FoodAnalysis {
  description: string;
  nutrients?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
  };
}

export default function CameraPage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCapture = async (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setCapturedImage(imageUrl);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiRequest('POST', '/api/analyze-food', formData);
      const data = await response.json();
      setAnalysis(response.data);
    } catch (error) {
      console.error('Error analyzing food:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Food Recognition
        </Typography>
        <Box sx={{ maxWidth: 500, mx: 'auto' }}>
          <CameraInput onCapture={handleCapture} />
          {capturedImage && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <img src={capturedImage} alt="Captured" style={{ maxWidth: '100%' }} />
              {loading && <CircularProgress sx={{ mt: 2 }} />}
              {analysis && (
                <Box sx={{ mt: 2, textAlign: 'left' }}>
                  <Typography variant="h6">Analysis Results:</Typography>
                  <Typography>{analysis.description}</Typography>
                  {analysis.nutrients && (
                    <Box sx={{ mt: 1 }}>
                      <Typography>Estimated Nutrients:</Typography>
                      <Typography>Calories: {analysis.nutrients.calories || 'N/A'}</Typography>
                      <Typography>Protein: {analysis.nutrients.protein || 'N/A'}g</Typography>
                      <Typography>Carbs: {analysis.nutrients.carbs || 'N/A'}g</Typography>
                      <Typography>Fats: {analysis.nutrients.fats || 'N/A'}g</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
