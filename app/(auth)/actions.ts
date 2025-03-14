"use server";

import { z } from "zod";

import { createUser, getUser } from "@/db/queries";

import { signIn } from "./auth";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

export interface RegisterActionState {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    let user;
    try {
      const users = await getUser(validatedData.email);
      user = users[0];
    } catch (err) {
      console.error("Error getting user from DB:", err);
      return { status: "failed" };
    }

    if (user) {
      return { status: "user_exists" };
    } else {
      try {
        await createUser(validatedData.email, validatedData.password);
      } catch (err) {
        console.error("Error creating user in DB:", err);
        return { status: "failed" };
      }

      try {
        await signIn("credentials", {
          email: validatedData.email,
          password: validatedData.password,
          redirect: false,
        });
      } catch (err) {
        console.error("Error signing in:", err);
        return { status: "failed" };
      }

      return { status: "success" };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};
