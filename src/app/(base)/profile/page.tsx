"use client";

import React, { useEffect, useState } from "react";

import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/modules/hooks";
import { useBannerStore } from "@/store/bannerStore";

interface ProfileData {
  firstName: string;
  lastName: string;
  username: string;
  country?: string;
  avatar?: string;
}

const ProfilePage = () => {
  const auth = useAuth();
  const { showBanner } = useBannerStore();

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    username: "",
    country: "",
    avatar: "",
  });

  const [editForm, setEditForm] = useState<ProfileData>({ ...profile });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth) return;
      try {
        const { data, error } = await supabase
          .from("Profile")
          .select("firstName, lastName, username, country, avatar")
          .eq("user_id", auth.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setProfile({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            username: data.username || "",
            country: data.country || "",
            avatar: data.avatar || "",
          });
          setEditForm({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            username: data.username || "",
            country: data.country || "",
            avatar: data.avatar || "",
          });
        }
      } catch {
        showBanner("Failed to load profile data", "error", 5000);
      } finally {
        setLoading(false);
      }
    };

    if (auth) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [auth, showBanner]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!auth) return;
    setSaving(true);
    try {
      const response = await fetch("/api/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: auth.id,
          ...editForm,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      setProfile({ ...editForm });
      setEditing(false);
      showBanner("Profile updated successfully!", "success", 5000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update profile";
      showBanner(errorMessage, "error", 5000);
    } finally {
      setSaving(false);
    }
  };

  if (!auth) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-grey-1 text-xl">
          Please log in to view your profile.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-cyan-2 text-xl">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="fade-slide-down mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Your Profile</h1>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="bg-cyan-3 rounded-lg px-6 py-2 font-medium text-white transition-colors hover:bg-emerald-500"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={() => setEditing(false)}
              className="bg-grey-4 hover:bg-grey-2 rounded-lg px-6 py-2 font-medium text-white transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-cyan-1 hover:bg-cyan-2 rounded-lg px-6 py-2 font-medium text-black transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-dark-1 rounded-xl p-8 shadow-lg shadow-black/20">
        <div className="flex flex-col items-start gap-12 md:flex-row">
          <div className="flex flex-col items-center gap-6">
            <div className="border-grey-4 bg-grey-2 relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4">
              <img
                src={
                  (editing ? editForm.avatar : profile.avatar) ||
                  `https://ui-avatars.com/api/?name=${
                    profile.firstName || profile.username || "User"
                  }&background=2d2f35&color=6ee7b7`
                }
                alt="Profile Avatar"
                className="h-full w-full object-cover"
              />
            </div>
            {editing && (
              <div className="w-full">
                <label className="text-grey-1 mb-1 block text-sm font-medium">
                  Avatar URL
                </label>
                <input
                  type="text"
                  name="avatar"
                  value={editForm.avatar}
                  onChange={handleEditChange}
                  placeholder="https://example.com/avatar.png"
                  className="border-grey-2 bg-grey-4 focus:border-cyan-2 w-full rounded-md border p-2 text-white outline-none"
                />
              </div>
            )}
          </div>
          <div className="flex w-full flex-1 flex-col gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-grey-3 text-sm font-medium">
                Username
              </label>
              {editing ? (
                <input
                  type="text"
                  name="username"
                  value={editForm.username}
                  onChange={handleEditChange}
                  className="border-grey-2 bg-grey-4 focus:border-cyan-2 w-full rounded-md border p-3 text-white transition-colors outline-none"
                />
              ) : (
                <p className="bg-grey-4/30 rounded-md border border-transparent p-3 text-lg font-medium text-white">
                  {profile.username || (
                    <span className="text-grey-2 italic">Not set</span>
                  )}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-grey-3 text-sm font-medium">
                  First Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleEditChange}
                    className="border-grey-2 bg-grey-4 focus:border-cyan-2 w-full rounded-md border p-3 text-white transition-colors outline-none"
                  />
                ) : (
                  <p className="bg-grey-4/30 rounded-md border border-transparent p-3 text-lg font-medium text-white">
                    {profile.firstName || (
                      <span className="text-grey-2 italic">Not set</span>
                    )}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-grey-3 text-sm font-medium">
                  Last Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleEditChange}
                    className="border-grey-2 bg-grey-4 focus:border-cyan-2 w-full rounded-md border p-3 text-white transition-colors outline-none"
                  />
                ) : (
                  <p className="bg-grey-4/30 rounded-md border border-transparent p-3 text-lg font-medium text-white">
                    {profile.lastName || (
                      <span className="text-grey-2 italic">Not set</span>
                    )}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-grey-3 text-sm font-medium">
                  Country
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="country"
                    value={editForm.country}
                    onChange={handleEditChange}
                    className="border-grey-2 bg-grey-4 focus:border-cyan-2 w-full rounded-md border p-3 text-white transition-colors outline-none"
                  />
                ) : (
                  <p className="bg-grey-4/30 rounded-md border border-transparent p-3 text-lg font-medium text-white">
                    {profile.country || (
                      <span className="text-grey-2 italic">Not set</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
