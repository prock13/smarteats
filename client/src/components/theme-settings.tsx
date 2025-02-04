import { useTheme } from "@/hooks/use-theme";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export function ThemeSettings() {
  const { theme, updateTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Theme Settings</h2>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="appearance">Appearance</Label>
          <Select
            value={theme.appearance}
            onValueChange={(value) =>
              updateTheme({ appearance: value as 'light' | 'dark' | 'system' })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select appearance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="variant">Style Variant</Label>
          <Select
            value={theme.variant}
            onValueChange={(value) =>
              updateTheme({ variant: value as 'professional' | 'tint' | 'vibrant' })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select style variant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="tint">Tint</SelectItem>
              <SelectItem value="vibrant">Vibrant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="primary-color">Primary Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={theme.primary}
              onChange={(e) => updateTheme({ primary: e.target.value })}
              className="w-[100px]"
            />
            <Input
              type="text"
              value={theme.primary}
              onChange={(e) => updateTheme({ primary: e.target.value })}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="radius">Border Radius</Label>
          <div className="flex gap-4 items-center">
            <Slider
              value={[theme.radius]}
              onValueChange={([value]) => updateTheme({ radius: value })}
              min={0}
              max={2}
              step={0.1}
              className="flex-1"
            />
            <span className="w-12 text-right">{theme.radius}rem</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
