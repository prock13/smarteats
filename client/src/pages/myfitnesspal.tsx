import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Container, Typography, Paper } from "@mui/material";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const mfpCredentialsSchema = z.object({
  username: z.string().min(1, "MyFitnessPal username is required"),
});

type FormData = z.infer<typeof mfpCredentialsSchema>;

export default function MyFitnessPalPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(mfpCredentialsSchema),
    defaultValues: {
      username: "",
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      console.log("Form submitted:", data);
      toast("Form submitted successfully");
      setIsSubmitted(true);
    } catch (error) {
      toast("Failed to submit form");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
          {!isSubmitted ? (
            <>
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
                  <Button type="submit" disabled={isSubmitting}>
                    Connect Account
                  </Button>
                </form>
              </Form>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h4" gutterBottom>
                Coming Soon!
              </Typography>
              <Typography variant="body1">
                MyFitnessPal integration is currently under development. We'll notify you when it's ready!
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}