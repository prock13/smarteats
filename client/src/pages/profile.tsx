import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Alert,
} from '@mui/material';

const userProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  height: z.string().min(1, "Height is required"),
  sex: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  country: z.string().min(1, "Country is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  timezone: z.string().min(1, "Timezone is required"),
  profilePicture: z.string().optional(),
});

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UserProfileForm = z.infer<typeof userProfileSchema>;
type PasswordUpdateForm = z.infer<typeof passwordUpdateSchema>;

export default function Profile(): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: profile, isLoading: isProfileLoading, error: profileError } = useQuery<UserProfileForm>({
    queryKey: ["/api/user/profile"],
    onError: (error: Error) => {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const profileForm = useForm<UserProfileForm>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: profile || {
      firstName: "",
      lastName: "",
      email: "",
      height: "",
      sex: "prefer_not_to_say",
      dateOfBirth: "",
      country: "",
      zipCode: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      profilePicture: "",
    },
  });

  const passwordForm = useForm<PasswordUpdateForm>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UserProfileForm) => {
      try {
        console.log('Submitting profile update:', data);
        const res = await apiRequest("POST", "/api/user/profile", data);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to update profile");
        }
        return res.json();
      } catch (error) {
        console.error('Profile update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Success",
        description: "Your profile has been updated",
      });
    },
    onError: (error: Error) => {
      console.error('Profile update error:', error);
      toast({
        title: "Error updating profile",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordUpdateForm) => {
      const res = await apiRequest("POST", "/api/user/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your password has been updated",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = async (data: UserProfileForm) => {
    try {
      await updateProfileMutation.mutateAsync(data);
    } catch (error) {
      console.error('Profile submission error:', error);
    }
  };

  const handlePasswordSubmit = (data: PasswordUpdateForm) => {
    updatePasswordMutation.mutate(data);
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePicture", file);

    try {
      const response = await apiRequest("POST", "/api/user/profile-picture", formData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload profile picture");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error) {
      console.error('Profile picture upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload profile picture",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Box sx={{ py: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" gutterBottom>
            Please log in to access your profile
          </Typography>
        </Container>
      </Box>
    );
  }

  if (isProfileLoading) {
    return (
      <Box sx={{ py: 4 }}>
        <Container maxWidth="lg">
          <Typography>Loading...</Typography>
        </Container>
      </Box>
    );
  }

  if (profileError) {
    return (
      <Box sx={{ py: 4 }}>
        <Container maxWidth="lg">
          <Alert severity="error">
            Failed to load profile: {profileError instanceof Error ? profileError.message : 'Unknown error'}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Profile Settings
        </Typography>

        {updateProfileMutation.error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {updateProfileMutation.error instanceof Error 
              ? updateProfileMutation.error.message 
              : "An unexpected error occurred"}
          </Alert>
        )}

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader
                avatar={
                  <Avatar
                    src={profile?.profilePicture}
                    alt={`${profileForm.watch("firstName")} ${profileForm.watch("lastName")}`}
                    sx={{ width: 80, height: 80 }}
                  />
                }
                title="User Details"
                action={
                  <Button
                    component="label"
                    variant="outlined"
                    sx={{ mt: 2 }}
                  >
                    Upload Picture
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                    />
                  </Button>
                }
              />
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        {...profileForm.register("firstName")}
                        error={!!profileForm.formState.errors.firstName}
                        helperText={profileForm.formState.errors.firstName?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        {...profileForm.register("lastName")}
                        error={!!profileForm.formState.errors.lastName}
                        helperText={profileForm.formState.errors.lastName?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="email"
                        label="Email Address"
                        {...profileForm.register("email")}
                        error={!!profileForm.formState.errors.email}
                        helperText={profileForm.formState.errors.email?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Height"
                        {...profileForm.register("height")}
                        error={!!profileForm.formState.errors.height}
                        helperText={profileForm.formState.errors.height?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Sex</InputLabel>
                        <Select
                          label="Sex"
                          {...profileForm.register("sex")}
                          error={!!profileForm.formState.errors.sex}
                        >
                          <MenuItem value="male">Male</MenuItem>
                          <MenuItem value="female">Female</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                          <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Date of Birth"
                        InputLabelProps={{ shrink: true }}
                        {...profileForm.register("dateOfBirth")}
                        error={!!profileForm.formState.errors.dateOfBirth}
                        helperText={profileForm.formState.errors.dateOfBirth?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Country"
                        {...profileForm.register("country")}
                        error={!!profileForm.formState.errors.country}
                        helperText={profileForm.formState.errors.country?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Zip Code"
                        {...profileForm.register("zipCode")}
                        error={!!profileForm.formState.errors.zipCode}
                        helperText={profileForm.formState.errors.zipCode?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Timezone"
                        {...profileForm.register("timezone")}
                        error={!!profileForm.formState.errors.timezone}
                        helperText={profileForm.formState.errors.timezone?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Update Password" />
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Current Password"
                        {...passwordForm.register("currentPassword")}
                        error={!!passwordForm.formState.errors.currentPassword}
                        helperText={passwordForm.formState.errors.currentPassword?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="New Password"
                        {...passwordForm.register("newPassword")}
                        error={!!passwordForm.formState.errors.newPassword}
                        helperText={passwordForm.formState.errors.newPassword?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Confirm New Password"
                        {...passwordForm.register("confirmPassword")}
                        error={!!passwordForm.formState.errors.confirmPassword}
                        helperText={passwordForm.formState.errors.confirmPassword?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        disabled={updatePasswordMutation.isPending}
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