import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Calendar from "@/pages/calendar";
import Recipes from "@/pages/recipes";

function Navigation() {
  return (
    <nav className="border-b bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex space-x-8">
              <Link href="/">
                <span className="inline-flex items-center px-1 pt-1 text-sm font-medium cursor-pointer hover:text-primary">
                  Meal Planner
                </span>
              </Link>
              <Link href="/calendar">
                <span className="inline-flex items-center px-1 pt-1 text-sm font-medium cursor-pointer hover:text-primary">
                  Calendar
                </span>
              </Link>
              <Link href="/recipes">
                <span className="inline-flex items-center px-1 pt-1 text-sm font-medium cursor-pointer hover:text-primary">
                  Recipes
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/recipes" component={Recipes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <Router />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;