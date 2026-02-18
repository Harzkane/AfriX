import { create } from "zustand";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import type { EducationProgress, Quiz, SubmitResult } from "../types/education.types";

export const useEducationStore = create<{
  progress: EducationProgress | null;
  loading: boolean;
  error: string | null;
  fetchProgress: () => Promise<void>;
  getQuiz: (module: string) => Promise<Quiz>;
  submitQuiz: (module: string, answers: number[]) => Promise<SubmitResult>;
}>((set, get) => ({
  progress: null,
  loading: false,
  error: null,

  fetchProgress: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.EDUCATION.PROGRESS);
      set({ progress: data.data, loading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Failed to load progress";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  getQuiz: async (module: string) => {
    set({ error: null });
    const { data } = await apiClient.get(API_ENDPOINTS.EDUCATION.QUIZ(module));
    return data.data as Quiz;
  },

  submitQuiz: async (module: string, answers: number[]) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.EDUCATION.SUBMIT(module), {
        answers,
      });
      set({ loading: false });
      return data.data as SubmitResult;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Quiz submit failed";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
}));
