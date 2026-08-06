import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useUserName } from "@/hooks/use-user-name";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "tournament-salt");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function NameDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { name, saveName, clearName } = useUserName();
  const [value, setValue] = useState(name);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("register");

  useEffect(() => {
    if (open) {
      setValue(name);
      setPassword("");
      setError("");
      setMode(name ? "login" : "register");
    }
  }, [open, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    if (password.length < 4) {
      setError("הסיסמה חייבת להכיל לפחות 4 תווים");
      return;
    }

    setLoading(true);
    setError("");

    const passwordHash = await hashPassword(password);

    const { data: existing, error: fetchError } = await supabase
      .from("users")
      .select("user_name")
      .eq("user_name", trimmed)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      setError("שגיאה בבדיקת שם המשתמש");
      setLoading(false);
      return;
    }

    if (existing) {
      const { data: user, error: verifyError } = await supabase
        .from("users")
        .select("password_hash")
        .eq("user_name", trimmed)
        .single();

      if (verifyError || !user) {
        setError("שגיאה באימות הסיסמה");
        setLoading(false);
        return;
      }

      if (user.password_hash !== passwordHash) {
        setError("שם המשתמש או הסיסמה שגויים");
        setLoading(false);
        return;
      }

      saveName(trimmed);
      onOpenChange(false);
    } else {
      const { error: insertError } = await supabase.from("users").insert({
        user_name: trimmed,
        password_hash: passwordHash,
      });

      if (insertError) {
        if (insertError.code === "23505") {
          setError("שם המשתמש כבר תפוס");
        } else {
          setError("לא ניתן ליצור משתמש כרגע");
        }
        setLoading(false);
        return;
      }

      saveName(trimmed);
      onOpenChange(false);
    }

    setLoading(false);
  };

  const handleSwitchMode = () => {
    setMode(mode === "register" ? "login" : "register");
    setError("");
    setPassword("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="text-right sm:max-w-sm">
        <DialogHeader className="text-right">
          <DialogTitle>{mode === "register" ? "הרשמה" : "התחברות"}</DialogTitle>
          <DialogDescription>
            {mode === "register"
              ? "צור שם משתמש וסיסמה כדי להשתתף בטורניר. שם המשתמש יופיע בטבלת המנחשים."
              : "הזן שם משתמש וסיסמה כדי להתחבר."}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="שם משתמש"
            maxLength={40}
            disabled={loading}
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה"
            maxLength={72}
            disabled={loading}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={value.trim().length < 2 || password.length < 4 || loading}>
            {loading ? "בודק..." : mode === "register" ? "הרשמה" : "התחברות"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSwitchMode}
            disabled={loading}
            className="self-center"
          >
            {mode === "register" ? "כבר יש לי משתמש" : "צור משתמש חדש"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
