"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import Link from "next/link";
import { signinAction } from "@/actions/authActions";
import { useFormStatus } from "react-dom";
import { useActionState, useEffect } from "react";
import { BiInfoCircle } from "react-icons/bi";
import { redirect } from "next/navigation";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full overflow-clip relative p-0 cursor-pointer transition-all duration-200 hover:bg-black hover:text-white border hover:border-green-600/20"
    >
      <div className="w-full h-full abolute flex items-center justify-center bg-linear-150 from-green-500/30 from-10% via-white/0 via-40% to-green-500/70 to-120%">
        {pending ? "Signing in..." : "Sign in"}
      </div>
    </Button>
  );
}

export default function SigninForm({
  jwtCookie,
}: {
  jwtCookie: RequestCookie | null;
}) {
  const initialState = { message: "", errors: {} };
  const [state, formAction] = useActionState(signinAction, initialState);

  useEffect(() => {
    if (state.user) {
      localStorage.setItem("user", JSON.stringify(state.user));
      redirect("/home");
    }
  }, [state.user]);

  const userInfo = localStorage.getItem("user");

  if (jwtCookie && jwtCookie.value && userInfo) {
    redirect("/home");
  }
  return (
    <Card className="w-full max-w-sm rounded-lg z-2 font-cabinet-grotesk tracking-wide">
      <CardHeader>
        <CardTitle className="text-2xl -mb-2">Signin</CardTitle>
        <CardDescription className="text-sm text-neutral-300">
          Sign in to use{" "}
          <span className="font-pencerio font-bold tracking-wider">
            meetdraw
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <div className="flex flex-col gap-4 text-gray-200">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="johndoe123"
                className="focus-visible:border-green-600/50 focus-visible:ring-green-600/20"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
                className="focus-visible:border-green-600/50 focus-visible:ring-green-600/20"
              />
            </div>
            {state.message && (
              <p className="text-sm -my-1 -mb-3 text-red-500 flex gap-2 font-light items-center">
                <BiInfoCircle />
                {state.message}
              </p>
            )}
            <SubmitButton />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2 -mt-3">
        <p className="self-start text-xs">
          Don't have an account?{" "}
          <Link href={"/signup"} className="underline hover:text-green-500">
            Sign up.
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
