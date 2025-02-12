import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/logo";
import { StyledEngineProvider, CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

type LoginFormData = Pick<InsertUser, "username" | "password">;

// Create a theme instance with proper SSR configuration
const theme = createTheme({
  components: {
    MuiPopover: {
      defaultProps: {
        container: () => document.body,
      },
    },
    MuiPopper: {
      defaultProps: {
        container: () => document.body,
      },
    },
    MuiModal: {
      defaultProps: {
        container: () => document.body,
      },
    },
  },
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");

  const loginForm = useForm<LoginFormData>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
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
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
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
          <Container
            component="main"
            maxWidth="sm"
            sx={{ bgcolor: "transparent" }}
          >
            <Card className="w-full shadow-lg">
              <CardHeader className="space-y-1">
                <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                  <Logo sx={{ fontSize: 128 }} />
                </Box>
                <CardTitle className="text-2xl text-center">
                  Welcome to SmartEats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={mode}
                  onValueChange={(v) => setMode(v as "login" | "register")}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form
                        onSubmit={loginForm.handleSubmit((data) =>
                          loginMutation.mutate(data),
                        )}
                        className="space-y-4"
                      >
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Logging in..." : "Login"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form
                        onSubmit={registerForm.handleSubmit((data) =>
                          registerMutation.mutate(data),
                        )}
                        className="space-y-4"
                      >
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending
                            ? "Creating account..."
                            : "Create account"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </Container>
        </Box>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
