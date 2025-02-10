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
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import React from 'react';

const userProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  height: z.string().optional(),
  sex: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  dateOfBirth: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  timezone: z.string().optional(),
  profilePicture: z.string().optional(),
  heightUnit: z.enum(["imperial", "metric"]).default("imperial"),
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
    retry: false,
    enabled: !!user,
  });

  const [heightUnit, setHeightUnit] = React.useState<'imperial' | 'metric'>(
    profile?.heightUnit || "imperial"
  );

  const profileForm = useForm<UserProfileForm>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: profile || {
      firstName: "",
      lastName: "",
      email: "",
      height: "",
      sex: "prefer_not_to_say" as const,
      dateOfBirth: "",
      country: "",
      zipCode: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      profilePicture: "",
      heightUnit: heightUnit,
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

  React.useEffect(() => {
    if (profile) {
      profileForm.reset(profile);
      setHeightUnit(profile.heightUnit || "imperial");
    }
  }, [profile, profileForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UserProfileForm) => {
      const res = await apiRequest("POST", "/api/user/profile", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      return res.json() as Promise<UserProfileForm>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating profile",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (data: UserProfileForm) => {
    updateProfileMutation.mutate(data);
  };

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
        variant: "default"
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

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", file);

    try {
      const response = await fetch("/api/user/profile-picture", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload profile picture");
      }

      const { url } = await response.json();
      profileForm.setValue("profilePicture", url);
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Profile picture upload error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload profile picture",
        variant: "destructive",
      });
    }
  };

  const handleHeightUnitChange = (_: React.MouseEvent<HTMLElement>, newUnit: 'imperial' | 'metric' | null) => {
    if (newUnit) {
      setHeightUnit(newUnit);
      profileForm.setValue("heightUnit", newUnit);

      const currentHeight = profileForm.getValues("height");
      if (currentHeight) {
        try {
          if (newUnit === "metric" && currentHeight.includes("'")) {
            const [feet, inches = "0"] = currentHeight.split("'").map(part => 
              parseInt(part.replace('"', '')) || 0
            );
            const totalInches = feet * 12 + inches;
            const cm = Math.round(totalInches * 2.54);
            profileForm.setValue("height", `${cm}`);
          } else if (newUnit === "imperial" && !currentHeight.includes("'")) {
            const cm = parseInt(currentHeight);
            const totalInches = cm / 2.54;
            const feet = Math.floor(totalInches / 12);
            const inches = Math.round(totalInches % 12);
            profileForm.setValue("height", `${feet}'${inches}"`);
          }
        } catch (error) {
          console.error("Height conversion error:", error);
        }
      }
    }
  };

  const handlePasswordSubmit = (data: PasswordUpdateForm) => {
    updatePasswordMutation.mutate(data);
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
                    src={profile?.profilePicture ?? undefined}
                    alt={`${profileForm.watch("firstName")} ${profileForm.watch("lastName")}`}
                    sx={{ width: 80, height: 80 }}
                  />
                }
                title={user?.username}
                subheader="Profile Picture"
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
                        label="First Name *"
                        required
                        InputLabelProps={{ shrink: true }}
                        {...profileForm.register("firstName")}
                        error={!!profileForm.formState.errors.firstName}
                        helperText={profileForm.formState.errors.firstName?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name *"
                        required
                        InputLabelProps={{ shrink: true }}
                        {...profileForm.register("lastName")}
                        error={!!profileForm.formState.errors.lastName}
                        helperText={profileForm.formState.errors.lastName?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="email"
                        label="Email Address *"
                        required
                        InputLabelProps={{ shrink: true }}
                        {...profileForm.register("email")}
                        error={!!profileForm.formState.errors.email}
                        helperText={profileForm.formState.errors.email?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel shrink>Height Unit</InputLabel>
                        <ToggleButtonGroup
                          value={heightUnit}
                          exclusive
                          onChange={handleHeightUnitChange}
                          aria-label="height unit"
                          size="small"
                          sx={{ mb: 1 }}
                        >
                          <ToggleButton value="imperial">
                            Imperial (ft/in)
                          </ToggleButton>
                          <ToggleButton value="metric">
                            Metric (cm)
                          </ToggleButton>
                        </ToggleButtonGroup>
                        <TextField
                          fullWidth
                          label={heightUnit === 'imperial' ? "Height (e.g., 5'11\")" : "Height (cm)"}
                          placeholder={heightUnit === 'imperial' ? "5'11\"" : "180"}
                          InputLabelProps={{ shrink: true }}
                          {...profileForm.register("height")}
                          error={!!profileForm.formState.errors.height}
                          helperText={
                            profileForm.formState.errors.height?.message ||
                            (heightUnit === 'imperial' ? "Enter in format: 5'11\"" : "Enter height in centimeters")
                          }
                        />
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel shrink id="sex-label">Sex</InputLabel>
                        <Select
                          labelId="sex-label"
                          label="Sex"
                          defaultValue={profile?.sex || "prefer_not_to_say"}
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
                        InputLabelProps={{ shrink: true }}
                        {...profileForm.register("country")}
                        error={!!profileForm.formState.errors.country}
                        helperText={profileForm.formState.errors.country?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Zip Code"
                        InputLabelProps={{ shrink: true }}
                        {...profileForm.register("zipCode")}
                        error={!!profileForm.formState.errors.zipCode}
                        helperText={profileForm.formState.errors.zipCode?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Timezone"
                        InputLabelProps={{ shrink: true }}
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