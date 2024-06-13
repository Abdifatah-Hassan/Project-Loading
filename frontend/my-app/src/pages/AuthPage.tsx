import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "@/services/authService";

function AuthPage() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminLogin(username, password);
      navigate("/admin");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error logging in:', error.message);
        alert(error.message);
      } else {
        console.error('Unexpected error', error);
        alert('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="retro-bg">
      <div className="center-contents">
        <Card className="w-[350px] max-h-[500px] ">
          <CardHeader>
            <CardTitle>Sign in to Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    id="username"
                    placeholder="Enter username..."
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    id="password"
                    placeholder="Enter your password"
                    type="password"
                  />
                </div>
                <Button type="submit">Sign in</Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between"></CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default AuthPage;
