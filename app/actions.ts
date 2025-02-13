"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";


export const signUpAction = async (formData: FormData) => {
  // Basic information
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const role = formData.get("role")?.toString();
  
  // School specific fields
  const schoolName = formData.get("schoolName")?.toString();
  const state = formData.get("state")?.toString();
  const district = formData.get("district")?.toString();
  const cluster = formData.get("cluster")?.toString();
  const block = formData.get("block")?.toString();
  
  // Teacher specific fields
  const fullName = formData.get("fullName")?.toString();
  const subjects = formData.getAll("subjects");
  const qualifications = formData.getAll("qualifications"); // Now getting all selected qualifications
  const experienceYears = formData.get("experienceYears")?.toString();
  const teachingGrade = formData.get("teachingGrade")?.toString();

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  // Basic validation
  if (!email || !password || !role || (!schoolName && !fullName)) {
    return encodedRedirect("error", "/sign-up", "All fields are required");
  }

  // Validate role
  if (role !== 'teacher' && role !== 'school') {
    return encodedRedirect("error", "/sign-up", "Invalid role selected");
  }

  // Role-specific validation
  if (role === 'school' && (!schoolName || !state || !district || !cluster || !block)) {
    return encodedRedirect("error", "/sign-up", "All school fields are required");
  }

  if (role === 'teacher' && (!fullName || !subjects.length || !qualifications.length || !experienceYears || !teachingGrade)) {
    return encodedRedirect("error", "/sign-up", "All teacher fields are required");
  }

  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/sign-in`,
      data: {
        full_name: fullName || schoolName,
        role: role
      }
    }
  });

  if (error) {
    return encodedRedirect("error", "/sign-up", error.message);
  }

  if (!user) {
    return encodedRedirect("error", "/sign-up", "Not Valid Information");
  }

  // Create base profile
  const profile = {
    id: user.id,
    full_name: fullName || schoolName,
    role: role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error: profileError } = await supabase
    .from('profiles')
    .insert([profile]);

  if (profileError) {
    await supabase.auth.admin.deleteUser(user.id);
    return encodedRedirect("error", "/sign-up", profileError.message);
  }

  // Create role-specific profile
  if (role === 'teacher') {
    const teacherProfile = {
      id: user.id,
      full_name: fullName,
      subjects: subjects,
      qualifications: qualifications, // Now an array of selected qualifications
      experience_years: parseInt(experienceYears || '0'),
      teaching_grade: parseInt(teachingGrade || '0'),
      email: email
    };

    const { error: teacherError } = await supabase
      .from('teacher_profiles')
      .insert([teacherProfile]);

    if (teacherError) {
      await supabase.auth.admin.deleteUser(user.id);
      return encodedRedirect("error", "/sign-up", teacherError.message);
    }
  } else if (role === 'school') {
    const schoolProfile = {
      id: user.id,
      school_name: schoolName,
      state: state,
      district: district,
      cluster: cluster,
      block: block,
      email: email
    };

    const { error: schoolError } = await supabase
      .from('school_profiles')
      .insert([schoolProfile]);

    if (schoolError) {
      await supabase.auth.admin.deleteUser(user.id);
      return encodedRedirect("error", "/sign-in", schoolError.message);
    }
  }

  return encodedRedirect(
    "success",
    "/sign-in",
    "Thanks for signing up! Please check your email for a verification link."
  );
};
export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (!user) {
    return encodedRedirect("error", "/sign-in", "User not found");
  }
  
  const metadata = user.user_metadata;
  const role = metadata.role;

if (role === 'teacher') {
  return redirect("/protected/teacher/dashboard");
} else if (role === 'school') {
  return redirect("/protected/school/dashboard");
} else {
  return encodedRedirect("error", "/sign-in", "User not found");
}


};
export const forgotPasswordAction = async (formData: FormData) => {
  try {
    const email = formData.get("email")?.toString();
    const callbackUrl = formData.get("callbackUrl")?.toString();
    const supabase = await createClient();
    const origin = (await headers()).get("origin");

    if (!origin) {
      throw new Error("Origin not found");
    }

    if (!email) {
      return encodedRedirect("error", "/forgot-password", "Email is required");
    }

    // Reset password with proper redirect handling
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?redirect_to=${callbackUrl || '/sign-in'}`,
    });

    if (error) {
      throw error;
    }

    // Handle successful password reset
    const redirectPath = callbackUrl || "/forgot-password";
    return encodedRedirect(
      "success",
      redirectPath,
      "Check your email for a password reset link."
    );

  } catch (error) {
    console.error("Password reset error:", error);
    return encodedRedirect(
      "error",
      "/forgot-password",
      error instanceof Error ? error.message : "Could not reset password"
    );
  }
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
