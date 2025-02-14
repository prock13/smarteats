import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Redirect } from "wouter";
import { 
  Box, 
  Container, 
  Card, 
  CardContent, 
  CardHeader,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab
} from "@mui/material";
import { Logo } from "@/components/logo";

type LoginFormData = Pick<InsertUser, "username" | "password">;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");

  const loginForm = useForm<LoginFormData>({
    defaultValues: {
      username: "",
      password: "",
    },
    resolver: zodResolver(
      insertUserSchema.pick({ username: true, password: true })
        .refine(
          (data) => data.username.length > 0,
          { message: "Username is required", path: ["username"] }
        )
        .refine(
          (data) => data.password.length > 0,
          { message: "Password is required", path: ["password"] }
        )
    ),
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(
      insertUserSchema
        .refine(
          (data) => data.username.length > 0,
          { message: "Username is required", path: ["username"] }
        )
        .refine(
          (data) => data.password.length > 0,
          { message: "Password is required", path: ["password"] }
        )
    ),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        width: "100%",
        bgcolor: "grey.100",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
      }}
    >
      <Container component="main" maxWidth="sm" sx={{ bgcolor: "transparent" }}>
        <Card sx={{ width: '100%', boxShadow: 3 }}>
          <CardHeader
            sx={{ textAlign: 'center', pb: 0 }}
            title={
              <>
                <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                  <Logo sx={{ fontSize: 128 }} />
                </Box>
                <Typography variant="h4" component="h1">
                  Welcome to SmartEats
                </Typography>
              </>
            }
          />
          <CardContent>
            <Tabs
              value={mode}
              onChange={(_, newValue) => setMode(newValue)}
              centered
              sx={{ mb: 3 }}
            >
              <Tab label="Login" value="login" />
              <Tab label="Register" value="register" />
            </Tabs>

            {mode === "login" && (
              <form
                onSubmit={loginForm.handleSubmit((data) =>
                  loginMutation.mutate(data)
                )}
                noValidate
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Username"
                    required
                    {...loginForm.register("username")}
                    error={!!loginForm.formState.errors.username}
                    helperText={loginForm.formState.errors.username?.message || ""}
                    fullWidth
                  />
                  <TextField
                    label="Password"
                    type="password"
                    required
                    {...loginForm.register("password")}
                    error={!!loginForm.formState.errors.password}
                    helperText={loginForm.formState.errors.password?.message || ""}
                    fullWidth
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loginMutation.isPending}
                    sx={{
                      background: 'linear-gradient(to right, #2e7d32, #1976d2)',
                      '&:hover': {
                        background: 'linear-gradient(to right, #1b5e20, #1565c0)',
                      },
                    }}
                  >
                    {loginMutation.isPending ? "Logging in..." : "Login"}
                  </Button>
                </Box>
              </form>
            )}

            {mode === "register" && (
              <form
                onSubmit={registerForm.handleSubmit((data) =>
                  registerMutation.mutate(data)
                )}
                noValidate
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Username"
                    required
                    {...registerForm.register("username")}
                    error={!!registerForm.formState.errors.username}
                    helperText={registerForm.formState.errors.username?.message || ""}
                    fullWidth
                  />
                  <TextField
                    label="Password"
                    type="password"
                    required
                    {...registerForm.register("password")}
                    error={!!registerForm.formState.errors.password}
                    helperText={registerForm.formState.errors.password?.message || ""}
                    fullWidth
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={registerMutation.isPending}
                    sx={{
                      background: 'linear-gradient(to right, #2e7d32, #1976d2)',
                      '&:hover': {
                        background: 'linear-gradient(to right, #1b5e20, #1565c0)',
                      },
                    }}
                  >
                    {registerMutation.isPending
                      ? "Creating account..."
                      : "Create account"}
                  </Button>
                </Box>
              </form>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}