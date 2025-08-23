"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/hooks";

type AuthMode = "login" | "signup";

const baseSchema = {
  email: z.email("Invalid email address").nonempty("Email is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .nonempty("Password is required"),
};

const loginSchema = z.object(baseSchema);

const signupSchema = z
  .object({
    ...baseSchema,
    confirmPassword: z.string().nonempty("Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const user = useAuth();
  if (user) {
    router.push("/");
  }

  const schema = mode === "login" ? loginSchema : signupSchema;
  type LoginFormInputs = z.infer<typeof loginSchema>;
  type SignupFormInputs = z.infer<typeof signupSchema>;
  type AuthFormInputs = LoginFormInputs &
    Partial<Omit<SignupFormInputs, keyof LoginFormInputs>>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AuthFormInputs>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: AuthFormInputs) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email!,
          password: data.password!,
        });
        if (error) {
          setErrorMsg(error.message);
          alert(error.message);
          return;
        }
        router.push("/");
      } else {
        // Signup flow
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: data.email!,
          password: data.password!,
        });

        if (error) {
          setErrorMsg(error.message);
          alert(error.message);
          return;
        }
        alert("Signup successful! Please verify your email before logging in.");
        setMode("login");
        reset();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setErrorMsg(null);
    reset();
  }, [mode, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="bg-dark-1 mx-auto flex w-md flex-col gap-4 rounded-lg p-8 shadow-2xl"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-grey-3 text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              id="email"
              {...register("email")}
              className={`bg-grey-4 w-full rounded-md border p-2 ${errors.email ? "border-red-500" : "border-grey-3"} focus:border-cyan-1 transition focus:outline-none`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-grey-3 text-sm font-medium"
            >
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              id="password"
              {...register("password")}
              className={`bg-grey-4 w-full rounded-md border p-2.5 ${errors.password ? "border-red-500" : "border-grey-3"} focus:border-cyan-1 transition focus:outline-none`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>
          {mode === "signup" && (
            <div className="flex flex-col gap-2">
              <label className="text-grey-3 text-sm font-medium">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm your password"
                {...register("confirmPassword")}
                className={`bg-grey-4 w-full rounded-md border p-2.5 ${errors.confirmPassword ? "border-red-500" : "border-grey-3"} focus:border-cyan-1 transition focus:outline-none`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-cyan-3 hover:ring-cyan-1 w-full rounded-md py-3 font-bold text-black transition-colors hover:cursor-pointer hover:ring-2 disabled:opacity-50"
        >
          {mode === "login" ? "Login" : "Sign Up"}
        </button>
      </div>
      <div className="flex justify-center gap-2">
        <p className="text-grey-3 text-sm">
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-cyan-1 text-sm font-medium hover:cursor-pointer"
        >
          {loading ? "Loading" : mode === "login" ? "Sign Up" : "Login"}
        </button>
      </div>
    </form>
  );
}
