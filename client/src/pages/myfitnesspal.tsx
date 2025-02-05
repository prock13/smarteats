import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Container, Typography, Paper, Grid, Button, CircularProgress } from "@mui/material";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertMfpCredentials } from "@shared/schema";
import { insertMfpCredentialsSchema } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyFitnessPalPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: mfpConnection, isLoading: isLoadingConnection } = useQuery({
    queryKey: ["/api/myfitnesspal/connection"],
    queryFn: async () => {
      const res = await fetch("/api/myfitnesspal/connection");
      if (!res.ok) throw new Error("Failed to fetch MFP connection status");
      return res.json();
    }
  });

  const { data: nutritionData, isLoading: isLoadingNutrition } = useQuery({
    queryKey: ["/api/myfitnesspal/nutrition"],
    queryFn: async () => {
      const res = await fetch("/api/myfitnesspal/nutrition");
      if (!res.ok) throw new Error("Failed to fetch nutrition data");
      return res.json();
    },
    enabled: !!mfpConnection?.connected
  });

  const form = useForm<InsertMfpCredentials>({
    resolver: zodResolver(insertMfpCredentialsSchema),
    defaultValues: {
      username: "",
    }
  });

  const connectMutation = useMutation({
    mutationFn: async (data: InsertMfpCredentials) => {
      try {
        const res = await apiRequest("POST", "/api/myfitnesspal/connect", data);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Failed to connect account");
        }
        return await res.json();
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ["/api/myfitnesspal/connection"] });
      toast({
        title: "Success",
        description: "Connected to MyFitnessPal successfully",
        variant: "default"
      });
      form.reset();
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const onSubmit = async (data: InsertMfpCredentials) => {
    setIsSubmitting(true);
    await connectMutation.mutateAsync(data);
  };

  if (isLoadingConnection) {
    return (
      <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            background: "linear-gradient(45deg, #4CAF50 30%, #2196F3 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 4,
            textAlign: "center"
          }}
        >
          MyFitnessPal Integration
        </Typography>

        {!mfpConnection?.connected && (
          <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Connect Your Account
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Link your MyFitnessPal account to sync nutrition data and track your progress.
            </Typography>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MyFitnessPal Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your MyFitnessPal username" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter your MyFitnessPal username to connect your account
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={connectMutation.isPending || isSubmitting}
                  sx={{ mt: 2 }}
                >
                  {(connectMutation.isPending || isSubmitting) ? (
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                  ) : null}
                  Connect Account
                </Button>
              </form>
            </Form>
          </Paper>
        )}
        {mfpConnection?.connected && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Connected Account</CardTitle>
                <CardDescription>
                  You're connected as {mfpConnection?.username}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Typography>
                  Your MyFitnessPal account is connected. View your nutrition data below.
                </Typography>
              </CardContent>
            </Card>

            {nutritionData && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Today's Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Typography>
                        Calories: {nutritionData.total_calories} / {nutritionData.goals.calories}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Macronutrients</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Typography>
                        Protein: {nutritionData.total_macros.protein}g
                      </Typography>
                      <Typography>
                        Carbs: {nutritionData.total_macros.carbohydrates}g
                      </Typography>
                      <Typography>
                        Fat: {nutritionData.total_macros.fat}g
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}