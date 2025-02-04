import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Box,
  Container,
  Typography,
  Grid,
} from '@mui/material';
import { ThemeSettings } from "@/components/theme-settings";

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordUpdateForm = z.infer<typeof passwordUpdateSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<PasswordUpdateForm>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordUpdateForm) => {
      const res = await apiRequest("POST", "/api/user/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your password has been updated",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PasswordUpdateForm) => {
    updatePasswordMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Profile Settings
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <ThemeSettings />
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Update Password" />
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Current Password"
                        {...form.register("currentPassword")}
                        error={!!form.formState.errors.currentPassword}
                        helperText={form.formState.errors.currentPassword?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="New Password"
                        {...form.register("newPassword")}
                        error={!!form.formState.errors.newPassword}
                        helperText={form.formState.errors.newPassword?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Confirm New Password"
                        {...form.register("confirmPassword")}
                        error={!!form.formState.errors.confirmPassword}
                        helperText={form.formState.errors.confirmPassword?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        disabled={updatePasswordMutation.isPending}
                        sx={{
                          py: 1.5,
                          background: "linear-gradient(45deg, #2E7D32 30%, #1565C0 90%)",
                          color: "white",
                          "&:hover": {
                            background: "linear-gradient(45deg, #1B5E20 30%, #0D47A1 90%)",
                          }
                        }}
                      >
                        {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}