"use client";

import React, { useEffect, useRef, useState } from "react";

import { countries } from "@/constants/countries";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/modules/hooks";
import { useBannerStore } from "@/store/bannerStore";

interface ProfileData {
  firstName: string;
  lastName: string;
  username: string;
  country?: string;
  avatar?: string;
  phone?: string;
  nickname?: string;
  createdAt?: string;
}

const getValidAvatarUrl = async (authId: string, filename: string) => {
  const cacheKey = `avatar_${authId}`;
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    try {
      const { url, expiresAt, storedFilename } = JSON.parse(cachedData);
      // Check if not expired (with 1 hour buffer) and filename hasn't changed
      if (storedFilename === filename && expiresAt > Date.now() + 3600000) {
        return url;
      }
    } catch {
      // ignore parse error
    }
  }

  const filePath = `${authId}/${filename}`;
  // 7 days expiration
  const { data: signed } = await supabase.storage
    .from("user-data")
    .createSignedUrl(filePath, 60 * 60 * 24 * 7);

  if (signed?.signedUrl) {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        url: signed.signedUrl,
        expiresAt: Date.now() + 60 * 60 * 24 * 7 * 1000,
        storedFilename: filename,
      }),
    );
    return signed.signedUrl;
  }
  return "";
};

const ProfilePage = () => {
  const auth = useAuth();
  const { showBanner } = useBannerStore();

  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    username: "",
    country: "",
    avatar: "",
    phone: "",
    nickname: "",
    createdAt: "",
  });

  const [editForm, setEditForm] = useState<ProfileData>({ ...profile });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth) return;
      try {
        const { data, error } = await supabase
          .from("Profile")
          .select(
            "firstName, lastName, username, country, avatar, phone, nickname",
          )
          .eq("user_id", auth.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          const avatarFilename = data.avatar || "";

          if (avatarFilename) {
            getValidAvatarUrl(auth.id, avatarFilename).then((url) => {
              setAvatarDisplayUrl(url);
            });
          }

          const profileData = {
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            username: data.username || "",
            country: data.country || "",
            avatar: avatarFilename,
            phone: data.phone || "",
            nickname: data.nickname || "",
            createdAt: auth.created_at,
          };
          setProfile(profileData);
          setEditForm(profileData);
        }
      } catch {
        showBanner("Failed to load profile data", "error", 5000, true);
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

    if (name === "phone") {
      // Only allow digits and limit to 10
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setEditForm((prev) => ({ ...prev, [name]: digitsOnly }));
      return;
    }

    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!auth) return;
    setSaving(true);
    try {
      // Build an object of only the fields that changed, excluding avatar
      const changedFields: Record<string, string | undefined> = {};
      const fieldsToCheck: (keyof ProfileData)[] = [
        "username",
        "firstName",
        "lastName",
        "country",
        "phone",
        "nickname",
        "avatar",
      ];

      for (const key of fieldsToCheck) {
        if (editForm[key] !== profile[key]) {
          changedFields[key] = editForm[key];
        }
      }

      if (Object.keys(changedFields).length === 0) {
        setEditing(false);
        showBanner("No changes to save.", "success", 3000);
        return;
      }

      if (changedFields.phone && changedFields.phone.length !== 10) {
        showBanner(
          "Phone number must be exactly 10 digits",
          "error",
          5000,
          true,
        );
        setSaving(false);
        return;
      }

      const response = await fetch("/api/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: auth.id,
          ...changedFields,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      setProfile({ ...editForm });
      setEditing(false);
      showBanner("Profile updated successfully!", "success", 5000);
    } catch {
      showBanner(
        "Failed to save profile. Please try again.",
        "error",
        5000,
        true,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (editing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${auth.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("user-data")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Invalidate cache to force getting the new image
      localStorage.removeItem(`avatar_${auth.id}`);
      const newUrl = await getValidAvatarUrl(auth.id, fileName);

      if (!newUrl) {
        throw new Error("Failed to create signed URL");
      }

      setAvatarDisplayUrl(newUrl);
      setEditForm((prev) => ({ ...prev, avatar: fileName }));
      showBanner("Avatar uploaded successfully!", "success", 3000);
    } catch {
      showBanner(
        "Failed to upload avatar. Please try again.",
        "error",
        5000,
        true,
      );
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = countries.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  const handleCountrySelect = (country: string) => {
    setEditForm((prev) => ({ ...prev, country }));
    setCountrySearch(country);
    setShowCountryDropdown(false);
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
            <div
              className={`border-grey-4 bg-grey-2 relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 ${editing ? "group cursor-pointer" : ""}`}
              onClick={handleAvatarClick}
            >
              <img
                src={
                  avatarDisplayUrl ||
                  `https://ui-avatars.com/api/?name=${
                    profile.firstName || profile.username || "User"
                  }&background=2d2f35&color=6ee7b7`
                }
                alt="Profile Avatar"
                className={`h-full w-full object-cover ${editing ? "transition-all duration-300 group-hover:blur-sm group-hover:brightness-50" : ""}`}
              />
              {editing && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="text-sm font-medium text-white">
                    {uploading ? "Uploading..." : "Change Image"}
                  </span>
                </div>
              )}
            </div>
            {!editing && profile.createdAt && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-cyan-2/60 text-xs font-bold tracking-widest uppercase">
                  Typing Since
                </span>
                <span className="text-grey-1 text-sm font-medium">
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {editing && (
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            )}
          </div>
          <div className="flex w-full flex-1 flex-col gap-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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

              <div className="flex flex-col gap-2">
                <label className="text-grey-3 text-sm font-medium">
                  Nickname
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="nickname"
                    value={editForm.nickname}
                    onChange={handleEditChange}
                    className="border-grey-2 bg-grey-4 focus:border-cyan-2 w-full rounded-md border p-3 text-white transition-colors outline-none"
                  />
                ) : (
                  <p className="bg-grey-4/30 rounded-md border border-transparent p-3 text-lg font-medium text-white">
                    {profile.nickname || (
                      <span className="text-grey-2 italic">Not set</span>
                    )}
                  </p>
                )}
              </div>
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

              <div className="relative flex flex-col gap-2">
                <label className="text-grey-3 text-sm font-medium">
                  Country
                </label>
                {editing ? (
                  <div className="relative" ref={countryDropdownRef}>
                    <input
                      type="text"
                      name="country"
                      value={
                        showCountryDropdown ? countrySearch : editForm.country
                      }
                      onChange={(e) => {
                        setCountrySearch(e.target.value);
                        setShowCountryDropdown(true);
                      }}
                      onFocus={() => {
                        setCountrySearch(editForm.country || "");
                        setShowCountryDropdown(true);
                      }}
                      placeholder="Search country..."
                      autoComplete="off"
                      className="border-grey-2 bg-grey-4 focus:border-cyan-2 w-full rounded-md border p-3 text-white transition-colors outline-none"
                    />
                    {showCountryDropdown && (
                      <div className="bg-grey-4 border-grey-2 absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border shadow-xl">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((c) => (
                            <div
                              key={c}
                              className="hover:bg-grey-2 cursor-pointer p-3 text-white transition-colors"
                              onClick={() => handleCountrySelect(c)}
                            >
                              {c}
                            </div>
                          ))
                        ) : (
                          <div className="text-grey-3 p-3 text-sm italic">
                            No countries found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="bg-grey-4/30 rounded-md border border-transparent p-3 text-lg font-medium text-white">
                    {profile.country || (
                      <span className="text-grey-2 italic">Not set</span>
                    )}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-grey-3 text-sm font-medium">
                  Phone Number
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditChange}
                    className="border-grey-2 bg-grey-4 focus:border-cyan-2 w-full rounded-md border p-3 text-white transition-colors outline-none"
                  />
                ) : (
                  <p className="bg-grey-4/30 rounded-md border border-transparent p-3 text-lg font-medium text-white">
                    {profile.phone || (
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
