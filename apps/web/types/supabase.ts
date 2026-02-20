// TODO: Auto-regenerate with: pnpm db:types
// This file is manually maintained to match the DB schema in supabase/migrations/.
// Run `supabase gen types typescript --local > apps/web/types/supabase.ts` when local Supabase is running.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "instructor" | "student";
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: "instructor" | "student";
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "instructor" | "student";
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          instructor_id: string;
          title: string;
          description: string | null;
          cover_image_url: string | null;
          category:
            | "programming"
            | "design"
            | "business"
            | "science"
            | "language"
            | "other"
            | null;
          status: "draft" | "published" | "archived";
          visibility: "public" | "invite_only";
          invite_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          instructor_id: string;
          title: string;
          description?: string | null;
          cover_image_url?: string | null;
          category?:
            | "programming"
            | "design"
            | "business"
            | "science"
            | "language"
            | "other"
            | null;
          status?: "draft" | "published" | "archived";
          visibility?: "public" | "invite_only";
          invite_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          instructor_id?: string;
          title?: string;
          description?: string | null;
          cover_image_url?: string | null;
          category?:
            | "programming"
            | "design"
            | "business"
            | "science"
            | "language"
            | "other"
            | null;
          status?: "draft" | "published" | "archived";
          visibility?: "public" | "invite_only";
          invite_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey";
            columns: ["instructor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      course_enrollments: {
        Row: {
          id: string;
          course_id: string;
          student_id: string;
          enrolled_at: string;
          status: "active" | "dropped" | "completed";
          progress_percent: number;
        };
        Insert: {
          id?: string;
          course_id: string;
          student_id: string;
          enrolled_at?: string;
          status?: "active" | "dropped" | "completed";
          progress_percent?: number;
        };
        Update: {
          id?: string;
          course_id?: string;
          student_id?: string;
          enrolled_at?: string;
          status?: "active" | "dropped" | "completed";
          progress_percent?: number;
        };
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_enrollments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      materials: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          content: string;
          excerpt: string | null;
          status: "draft" | "published";
          position: number;
          tags: string[];
          read_time_minutes: number | null;
          version: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          content?: string;
          excerpt?: string | null;
          status?: "draft" | "published";
          position?: number;
          tags?: string[];
          read_time_minutes?: number | null;
          version?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          content?: string;
          excerpt?: string | null;
          status?: "draft" | "published";
          position?: number;
          tags?: string[];
          read_time_minutes?: number | null;
          version?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "materials_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          material_id: string;
          course_id: string;
          author_id: string;
          title: string;
          content: string;
          heading_id: string | null;
          selected_text: string | null;
          status: "OPEN" | "RESOLVED" | "CLOSED";
          upvote_count: number;
          answer_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          course_id: string;
          author_id: string;
          title: string;
          content: string;
          heading_id?: string | null;
          selected_text?: string | null;
          status?: "OPEN" | "RESOLVED" | "CLOSED";
          upvote_count?: number;
          answer_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          material_id?: string;
          course_id?: string;
          author_id?: string;
          title?: string;
          content?: string;
          heading_id?: string | null;
          selected_text?: string | null;
          status?: "OPEN" | "RESOLVED" | "CLOSED";
          upvote_count?: number;
          answer_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      answers: {
        Row: {
          id: string;
          question_id: string;
          author_id: string;
          content: string;
          is_accepted: boolean;
          is_ai_generated: boolean;
          upvote_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          author_id: string;
          content: string;
          is_accepted?: boolean;
          is_ai_generated?: boolean;
          upvote_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          author_id?: string;
          content?: string;
          is_accepted?: boolean;
          is_ai_generated?: boolean;
          upvote_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "answers_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      votes: {
        Row: {
          id: string;
          user_id: string;
          target_type: "question" | "answer";
          target_id: string;
          value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_type: "question" | "answer";
          target_id: string;
          value: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_type?: "question" | "answer";
          target_id?: string;
          value?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          id: string;
          course_id: string;
          name: string;
          description: string | null;
          created_by: string | null;
          max_members: number;
          invite_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          name: string;
          description?: string | null;
          created_by?: string | null;
          max_members?: number;
          invite_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          name?: string;
          description?: string | null;
          created_by?: string | null;
          max_members?: number;
          invite_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: "leader" | "member";
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: "leader" | "member";
          joined_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: "leader" | "member";
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      memos: {
        Row: {
          id: string;
          author_id: string;
          material_id: string | null;
          team_id: string | null;
          title: string;
          content: string;
          anchor_id: string | null;
          tags: string[];
          visibility: "personal" | "team";
          is_draft: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          material_id?: string | null;
          team_id?: string | null;
          title: string;
          content?: string;
          anchor_id?: string | null;
          tags?: string[];
          visibility?: "personal" | "team";
          is_draft?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          material_id?: string | null;
          team_id?: string | null;
          title?: string;
          content?: string;
          anchor_id?: string | null;
          tags?: string[];
          visibility?: "personal" | "team";
          is_draft?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memos_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memos_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memos_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      quizzes: {
        Row: {
          id: string;
          course_id: string;
          created_by: string | null;
          title: string;
          description: string | null;
          time_limit_minutes: number | null;
          passing_score: number;
          allow_reattempt: boolean;
          shuffle_questions: boolean;
          show_answers_after_submit: boolean;
          focus_loss_warning: boolean;
          due_date: string | null;
          status: "draft" | "published" | "closed";
          is_ai_generated: boolean;
          source_material_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          created_by?: string | null;
          title: string;
          description?: string | null;
          time_limit_minutes?: number | null;
          passing_score?: number;
          allow_reattempt?: boolean;
          shuffle_questions?: boolean;
          show_answers_after_submit?: boolean;
          focus_loss_warning?: boolean;
          due_date?: string | null;
          status?: "draft" | "published" | "closed";
          is_ai_generated?: boolean;
          source_material_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          created_by?: string | null;
          title?: string;
          description?: string | null;
          time_limit_minutes?: number | null;
          passing_score?: number;
          allow_reattempt?: boolean;
          shuffle_questions?: boolean;
          show_answers_after_submit?: boolean;
          focus_loss_warning?: boolean;
          due_date?: string | null;
          status?: "draft" | "published" | "closed";
          is_ai_generated?: boolean;
          source_material_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quizzes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quizzes_source_material_id_fkey";
            columns: ["source_material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          question_type:
            | "multiple_choice"
            | "true_false"
            | "short_answer"
            | "fill_in_the_blank";
          content: string;
          options: Json | null;
          correct_answer: string | null;
          explanation: string | null;
          points: number;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question_type:
            | "multiple_choice"
            | "true_false"
            | "short_answer"
            | "fill_in_the_blank";
          content: string;
          options?: Json | null;
          correct_answer?: string | null;
          explanation?: string | null;
          points?: number;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          question_type?:
            | "multiple_choice"
            | "true_false"
            | "short_answer"
            | "fill_in_the_blank";
          content?: string;
          options?: Json | null;
          correct_answer?: string | null;
          explanation?: string | null;
          points?: number;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          student_id: string;
          status: "in_progress" | "submitted" | "graded";
          score: number | null;
          total_points: number;
          started_at: string;
          submitted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          student_id: string;
          status?: "in_progress" | "submitted" | "graded";
          score?: number | null;
          total_points?: number;
          started_at?: string;
          submitted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          student_id?: string;
          status?: "in_progress" | "submitted" | "graded";
          score?: number | null;
          total_points?: number;
          started_at?: string;
          submitted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          answer: string | null;
          is_correct: boolean | null;
          points_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          answer?: string | null;
          is_correct?: boolean | null;
          points_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_id?: string;
          answer?: string | null;
          is_correct?: boolean | null;
          points_earned?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey";
            columns: ["attempt_id"];
            isOneToOne: false;
            referencedRelation: "quiz_attempts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "quiz_questions";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type:
            | "new_question"
            | "new_answer"
            | "answer_accepted"
            | "quiz_graded"
            | "team_invite"
            | "team_join"
            | "mention";
          title: string;
          message: string | null;
          data: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type:
            | "new_question"
            | "new_answer"
            | "answer_accepted"
            | "quiz_graded"
            | "team_invite"
            | "team_join"
            | "mention";
          title: string;
          message?: string | null;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?:
            | "new_question"
            | "new_answer"
            | "answer_accepted"
            | "quiz_graded"
            | "team_invite"
            | "team_join"
            | "mention";
          title?: string;
          message?: string | null;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_course_instructor: {
        Args: {
          p_course_id: string;
        };
        Returns: boolean;
      };
      is_course_enrolled: {
        Args: {
          p_course_id: string;
        };
        Returns: boolean;
      };
      is_team_member: {
        Args: {
          p_team_id: string;
        };
        Returns: boolean;
      };
      set_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for convenient table access
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Convenience row types
export type Profile = Tables<"profiles">;
export type Course = Tables<"courses">;
export type CourseEnrollment = Tables<"course_enrollments">;
export type Material = Tables<"materials">;
export type Question = Tables<"questions">;
export type Answer = Tables<"answers">;
export type Vote = Tables<"votes">;
export type Team = Tables<"teams">;
export type TeamMember = Tables<"team_members">;
export type Memo = Tables<"memos">;
export type Quiz = Tables<"quizzes">;
export type QuizQuestion = Tables<"quiz_questions">;
export type QuizAttempt = Tables<"quiz_attempts">;
export type QuizAnswer = Tables<"quiz_answers">;
export type Notification = Tables<"notifications">;
