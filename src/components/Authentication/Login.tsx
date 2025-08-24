"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/hooks";
import { useBannerStore } from "@/store/bannerStore";
import { useUserStore } from "@/store";
import { BeatLoader, ClipLoader } from "react-spinners";

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
    username: z.string().nonempty("Username is required"),
    firstName: z.string().nonempty("First name is required"),
    lastName: z.string().nonempty("Last name is required"),
    confirmPassword: z.string().nonempty("Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const { showBanner } = useBannerStore();
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
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email!,
          password: data.password!,
        });
        if (error) {
          showBanner(error.message, "error", 15000);
          return;
        }
        showBanner("You are Logged In successfully.", "success", 5000);

        // router.push("/");
      } else {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: data.email!,
          password: data.password!,
        });

        if (error) {
          showBanner(error.message, "error", 15000);
          return;
        }
        if (signUpData?.user) {
          await fetch("/api/create-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: signUpData.user.id,
              username: data.username!,
              firstName: data.firstName!,
              lastName: data.lastName!,
            }),
          });
        }
        showBanner(
          "You are signed Up successfully. Please check your inbox for verification email.",
          "success",
          15000,
        );
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
        className="bg-dark-1 mx-auto flex w-md flex-col gap-4 rounded-lg p-8 shadow-2xl"
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
            className="bg-cyan-3 hover:ring-cyan-1 w-full rounded-md py-3 font-bold text-white transition-colors hover:cursor-pointer hover:ring-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <BeatLoader size={10} color="#fff" />
            ) : mode === "login" ? (
              "Login"
            ) : (
              "Sign Up"
            )}
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
    </>
  );
}
