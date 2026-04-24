"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { BeatLoader } from "react-spinners";
import * as z from "zod";

import { supabase } from "@/lib/supabaseClient";
import { useBannerStore } from "@/store/bannerStore";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .nonempty("Password is required"),
    confirmPassword: z.string().nonempty("Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormInputs = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const { showBanner } = useBannerStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ResetPasswordFormInputs>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormInputs) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        showBanner(
          "Failed to reset password. The link might be invalid or expired.",
          "error",
          5000,
          true,
        );
        return;
      }

      showBanner(
        "Password updated successfully! You can now login.",
        "success",
        5000,
      );
      reset();
      router.push("/auth");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="bg-dark-1 mx-auto mt-10 flex w-md flex-col gap-4 rounded-lg p-8"
    >
      <h2 className="mb-4 text-center text-2xl font-bold text-white">
        Reset Password
      </h2>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-grey-3 text-sm font-medium"
            >
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
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
          <div className="flex flex-col gap-2">
            <label className="text-grey-3 text-sm font-medium">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Confirm new password"
              {...register("confirmPassword")}
              className={`bg-grey-4 w-full rounded-md border p-2.5 ${errors.confirmPassword ? "border-red-500" : "border-grey-3"} focus:border-cyan-1 transition focus:outline-none`}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || loading}
          className="bg-cyan-3 hover:ring-cyan-1 w-full rounded-md py-3 font-bold text-white transition-colors hover:cursor-pointer hover:ring-2 disabled:opacity-50"
        >
          {isSubmitting || loading ? (
            <BeatLoader size={10} color="#fff" />
          ) : (
            "Update Password"
          )}
        </button>
      </div>
    </form>
  );
}
