"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { BeatLoader } from "react-spinners";
import * as z from "zod";

import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/modules/hooks";
import { useBannerStore } from "@/store/bannerStore";

type AuthMode = "login" | "signup" | "forgot_password";

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
    username: z.string().nonempty("Username is required"),
    firstName: z.string().nonempty("First name is required"),
    lastName: z.string().nonempty("Last name is required"),
    confirmPassword: z.string().nonempty("Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const forgotPasswordSchema = z.object({
  email: baseSchema.email,
});

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const { showBanner } = useBannerStore();
  const router = useRouter();

  const user = useAuth();
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const schema =
    mode === "login"
      ? loginSchema
      : mode === "signup"
        ? signupSchema
        : forgotPasswordSchema;
  type LoginFormInputs = z.infer<typeof loginSchema>;
  type SignupFormInputs = z.infer<typeof signupSchema>;
  type ForgotPasswordFormInputs = z.infer<typeof forgotPasswordSchema>;
  type AuthFormInputs = LoginFormInputs &
    Partial<Omit<SignupFormInputs, keyof LoginFormInputs>> &
    Partial<ForgotPasswordFormInputs>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AuthFormInputs>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
  });

  const onSubmit = async (data: AuthFormInputs) => {
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email!,
          password: data.password!,
        });
        if (error) {
          showBanner("Invalid email or password.", "error", 15000, true);
          return;
        }
        showBanner("You are Logged In successfully.", "success", 5000);

        // router.push("/");
      } else if (mode === "signup") {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: data.email!,
          password: data.password!,
        });

        if (error) {
          showBanner(
            "Failed to create account. Please check your details and try again.",
            "error",
            5000,
            true,
          );
          return;
        }
        if (signUpData?.user) {
          const res = await fetch("/api/create-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: signUpData.user.id,
              username: data.username!,
              firstName: data.firstName!,
              lastName: data.lastName!,
            }),
          });

          if (!res.ok) {
            showBanner(
              "Failed to create profile. Please try signing up again.",
              "error",
              5000,
              true,
            );
            return;
          }
        }
        showBanner(
          "Verification email sent! Please check your inbox to activate your account.",
          "success",
          5000,
          true,
        );
        setMode("login");
        reset();
      } else if (mode === "forgot_password") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          data.email!,
          {
            redirectTo: `${window.location.origin}/reset-password`,
          },
        );
        if (error) {
          showBanner(
            "Failed to send reset link. Please try again.",
            "error",
            5000,
            true,
          );
          return;
        }
        showBanner("Password reset link sent to your email.", "success", 15000);
        setMode("login");
        reset();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reset();
  }, [mode, reset]);

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="bg-dark-1 mx-auto flex w-md flex-col gap-4 rounded-lg p-8"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            {mode == "signup" && (
              <div className="flex gap-4">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="firstname"
                    className="text-grey-3 text-sm font-medium"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="First Name"
                    id="firstName"
                    {...register("firstName")}
                    className={`bg-grey-4 w-full rounded-md border p-2 ${errors.firstName ? "border-red-500" : "border-grey-3"} focus:border-cyan-1 transition focus:outline-none`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="lastName"
                    className="text-grey-3 text-sm font-medium"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    id="lastName"
                    {...register("lastName")}
                    className={`bg-grey-4 w-full rounded-md border p-2 ${errors.lastName ? "border-red-500" : "border-grey-3"} focus:border-cyan-1 transition focus:outline-none`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
            )}
            {mode == "signup" && (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="email"
                  className="text-grey-3 text-sm font-medium"
                >
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  id="username"
                  {...register("username")}
                  className={`bg-grey-4 w-full rounded-md border p-2 ${errors.username ? "border-red-500" : "border-grey-3"} focus:border-cyan-1 transition focus:outline-none`}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.username.message}
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-grey-3 text-sm font-medium"
              >
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
            {mode !== "forgot_password" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-grey-3 text-sm font-medium"
                  >
                    Password
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot_password")}
                      className="text-cyan-1 text-sm font-medium hover:underline focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
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
            )}
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
            className="bg-cyan-3 hover:ring-cyan-1 w-full rounded-md py-3 font-bold text-white transition-colors hover:cursor-pointer hover:ring-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <BeatLoader size={10} color="#fff" />
            ) : mode === "login" ? (
              "Login"
            ) : mode === "forgot_password" ? (
              "Send Reset Link"
            ) : (
              "Sign Up"
            )}
          </button>
        </div>
        <div className="flex justify-center gap-2">
          <p className="text-grey-3 text-sm">
            {mode === "login"
              ? "Don't have an account?"
              : mode === "forgot_password"
                ? "Remembered your password?"
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
    </>
  );
}
