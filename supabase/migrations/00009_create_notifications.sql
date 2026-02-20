-- Migration: 00009_create_notifications
-- Description: Create notifications table

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_question', 'new_answer', 'answer_accepted', 'quiz_graded', 'team_invite', 'team_join', 'mention')),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notifications IS 'User notifications for various events';
COMMENT ON COLUMN public.notifications.data IS 'JSON metadata for notification context';
