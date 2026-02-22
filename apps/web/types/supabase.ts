export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      answers: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_accepted: boolean
          is_ai_generated: boolean
          question_id: string
          updated_at: string
          upvote_count: number
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_accepted?: boolean
          is_ai_generated?: boolean
          question_id: string
          updated_at?: string
          upvote_count?: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_accepted?: boolean
          is_ai_generated?: boolean
          question_id?: string
          updated_at?: string
          upvote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "answers_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "v_instructor_pending_qa"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "v_student_qa_activity"
            referencedColumns: ["question_id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          progress_percent: number
          status: string
          student_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          progress_percent?: number
          status?: string
          student_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          progress_percent?: number
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_instructor_courses_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_student_enrolled_courses"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          instructor_id: string
          invite_code: string | null
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instructor_id: string
          invite_code?: string | null
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instructor_id?: string
          invite_code?: string | null
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          content: string
          course_id: string
          created_at: string
          excerpt: string | null
          id: string
          position: number
          read_time_minutes: number | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          version: number | null
        }
        Insert: {
          content?: string
          course_id: string
          created_at?: string
          excerpt?: string | null
          id?: string
          position?: number
          read_time_minutes?: number | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          position?: number
          read_time_minutes?: number | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_instructor_courses_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_student_enrolled_courses"
            referencedColumns: ["course_id"]
          },
        ]
      }
      memos: {
        Row: {
          anchor_id: string | null
          author_id: string
          content: string
          created_at: string
          id: string
          is_draft: boolean
          material_id: string | null
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          anchor_id?: string | null
          author_id: string
          content?: string
          created_at?: string
          id?: string
          is_draft?: boolean
          material_id?: string | null
          tags?: string[] | null
          team_id?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          anchor_id?: string | null
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_draft?: boolean
          material_id?: string | null
          tags?: string[] | null
          team_id?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "memos_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memos_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memos_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memos_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_team_overview"
            referencedColumns: ["team_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id: string
          role: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer_count: number
          author_id: string
          content: string
          course_id: string
          created_at: string
          heading_id: string | null
          id: string
          material_id: string
          selected_text: string | null
          status: string
          title: string
          updated_at: string
          upvote_count: number
        }
        Insert: {
          answer_count?: number
          author_id: string
          content: string
          course_id: string
          created_at?: string
          heading_id?: string | null
          id?: string
          material_id: string
          selected_text?: string | null
          status?: string
          title: string
          updated_at?: string
          upvote_count?: number
        }
        Update: {
          answer_count?: number
          author_id?: string
          content?: string
          course_id?: string
          created_at?: string
          heading_id?: string | null
          id?: string
          material_id?: string
          selected_text?: string | null
          status?: string
          title?: string
          updated_at?: string
          upvote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_instructor_courses_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_student_enrolled_courses"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "questions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          answer: string | null
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          points_earned: number
          question_id: string
        }
        Insert: {
          answer?: string | null
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number
          question_id: string
        }
        Update: {
          answer?: string | null
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "v_student_quiz_results"
            referencedColumns: ["attempt_id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          created_at: string
          id: string
          quiz_id: string
          score: number | null
          started_at: string
          status: string
          student_id: string
          submitted_at: string | null
          total_points: number
        }
        Insert: {
          created_at?: string
          id?: string
          quiz_id: string
          score?: number | null
          started_at?: string
          status?: string
          student_id: string
          submitted_at?: string | null
          total_points?: number
        }
        Update: {
          created_at?: string
          id?: string
          quiz_id?: string
          score?: number | null
          started_at?: string
          status?: string
          student_id?: string
          submitted_at?: string | null
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "v_instructor_quiz_performance"
            referencedColumns: ["quiz_id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "v_student_upcoming_quizzes"
            referencedColumns: ["quiz_id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          content: string
          correct_answer: string | null
          created_at: string
          explanation: string | null
          id: string
          options: Json | null
          order_index: number
          points: number
          question_type: string
          quiz_id: string
        }
        Insert: {
          content: string
          correct_answer?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          question_type: string
          quiz_id: string
        }
        Update: {
          content?: string
          correct_answer?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "v_instructor_quiz_performance"
            referencedColumns: ["quiz_id"]
          },
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "v_student_upcoming_quizzes"
            referencedColumns: ["quiz_id"]
          },
        ]
      }
      quizzes: {
        Row: {
          allow_reattempt: boolean
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          focus_loss_warning: boolean
          id: string
          is_ai_generated: boolean
          passing_score: number
          show_answers_after_submit: boolean
          shuffle_questions: boolean
          source_material_id: string | null
          status: string
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          allow_reattempt?: boolean
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          focus_loss_warning?: boolean
          id?: string
          is_ai_generated?: boolean
          passing_score?: number
          show_answers_after_submit?: boolean
          shuffle_questions?: boolean
          source_material_id?: string | null
          status?: string
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          allow_reattempt?: boolean
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          focus_loss_warning?: boolean
          id?: string
          is_ai_generated?: boolean
          passing_score?: number
          show_answers_after_submit?: boolean
          shuffle_questions?: boolean
          source_material_id?: string | null
          status?: string
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_instructor_courses_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_student_enrolled_courses"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_source_material_id_fkey"
            columns: ["source_material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          last_active_at: string | null
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_active_at?: string | null
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_active_at?: string | null
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_team_overview"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          invite_code: string | null
          max_members: number
          name: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invite_code?: string | null
          max_members?: number
          name: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invite_code?: string | null
          max_members?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_instructor_courses_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "teams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_student_enrolled_courses"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_instructor_courses_overview: {
        Row: {
          course_id: string | null
          enrolled_count: number | null
          instructor_id: string | null
          is_published: boolean | null
          materials_count: number | null
          pending_qa_count: number | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_instructor_pending_qa: {
        Row: {
          asked_at: string | null
          course_name: string | null
          instructor_id: string | null
          is_urgent: boolean | null
          question_excerpt: string | null
          question_id: string | null
          student_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_instructor_quiz_performance: {
        Row: {
          average_score: number | null
          course_name: string | null
          instructor_id: string | null
          pass_rate: number | null
          quiz_id: string | null
          quiz_title: string | null
          submission_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_student_enrolled_courses: {
        Row: {
          course_id: string | null
          enrollment_id: string | null
          instructor_name: string | null
          last_accessed_at: string | null
          progress_percent: number | null
          student_id: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_student_qa_activity: {
        Row: {
          author_id: string | null
          course_name: string | null
          created_at: string | null
          question_excerpt: string | null
          question_id: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_student_quiz_results: {
        Row: {
          attempt_id: string | null
          course_name: string | null
          quiz_title: string | null
          score: number | null
          student_id: string | null
          taken_at: string | null
          total_points: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_student_upcoming_quizzes: {
        Row: {
          course_name: string | null
          due_date: string | null
          question_count: number | null
          quiz_id: string | null
          quiz_title: string | null
          student_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_team_members_detail: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          last_active_at: string | null
          member_id: string | null
          role: string | null
          team_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_team_overview"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_team_overview: {
        Row: {
          course_name: string | null
          created_at: string | null
          description: string | null
          member_count: number | null
          team_id: string | null
          team_name: string | null
        }
        Relationships: []
      }
      v_team_shared_memos: {
        Row: {
          author_name: string | null
          excerpt: string | null
          memo_id: string | null
          team_id: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memos_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memos_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_team_overview"
            referencedColumns: ["team_id"]
          },
        ]
      }
    }
    Functions: {
      duplicate_quiz: {
        Args: { p_quiz_id: string }
        Returns: {
          allow_reattempt: boolean
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          focus_loss_warning: boolean
          id: string
          is_ai_generated: boolean
          passing_score: number
          show_answers_after_submit: boolean
          shuffle_questions: boolean
          source_material_id: string | null
          status: string
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "quizzes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_instructor_activity_feed: {
        Args: { p_instructor_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          actor_name: string
          course_name: string
          created_at: string
          id: string
          type: string
        }[]
      }
      get_student_activity_stats: {
        Args: { p_instructor_id: string }
        Returns: Json
      }
      get_student_study_progress: { Args: { p_user_id: string }; Returns: Json }
      get_team_activity_feed: {
        Args: { p_limit?: number; p_offset?: number; p_team_id: string }
        Returns: {
          actor_name: string
          created_at: string
          description: string
          id: string
          type: string
        }[]
      }
      get_user_role: { Args: never; Returns: string }
      is_course_enrolled: { Args: { p_course_id: string }; Returns: boolean }
      is_course_instructor: { Args: { p_course_id: string }; Returns: boolean }
      is_team_member: { Args: { p_team_id: string }; Returns: boolean }
      start_quiz_attempt: {
        Args: { p_quiz_id: string }
        Returns: {
          created_at: string
          id: string
          quiz_id: string
          score: number | null
          started_at: string
          status: string
          student_id: string
          submitted_at: string | null
          total_points: number
        }
        SetofOptions: {
          from: "*"
          to: "quiz_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_and_grade_quiz: {
        Args: { p_attempt_id: string }
        Returns: {
          created_at: string
          id: string
          quiz_id: string
          score: number | null
          started_at: string
          status: string
          student_id: string
          submitted_at: string | null
          total_points: number
        }
        SetofOptions: {
          from: "*"
          to: "quiz_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

