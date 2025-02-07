import { useState, useRef, useEffect } from "react";
import { Box, TextField, Typography, Paper, Avatar } from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getChatbotResponse } from "@/lib/chatbot-service";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatBotProps {
  open: boolean;
  onClose: () => void;
}

export function ChatBot({ open, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hi! I'm Chef Nina, your personal meal planning assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await getChatbotResponse(input, {
        // Add user preferences here when available
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to get chatbot response:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <Box sx={{ 
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <SheetHeader className="border-b pb-2">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src="/chef-avatar.png"
                alt="Chef Nina"
                sx={{ width: 40, height: 40 }}
              />
              <SheetTitle>Chat with Chef Nina</SheetTitle>
            </Box>
          </SheetHeader>

          <Box sx={{ 
            flex: 1, 
            overflowY: "auto", 
            p: 2, 
            display: "flex", 
            flexDirection: "column", 
            gap: 2,
            bgcolor: 'background.paper',
          }}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: "70%",
                    bgcolor: message.role === "user" ? "primary.main" : "background.default",
                    color: message.role === "user" ? "primary.contrastText" : "text.primary",
                  }}
                >
                  <Typography variant="body1">{message.content}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Paper>
              </Box>
            ))}
            {isTyping && (
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Chef Nina is typing...
                </Typography>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Ask Chef Nina about meal suggestions..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                size="small"
                sx={{
                  '& .MuiInputBase-input': {
                    color: 'text.primary',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
              <Button onClick={handleSend} disabled={!input.trim() || isTyping}>
                <SendIcon />
              </Button>
            </Box>
          </Box>
        </Box>
      </SheetContent>
    </Sheet>
  );
}