-- Migration: 00007_create_memos
-- Description: Create memos table for personal and team notes

CREATE TABLE public.memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  anchor_id TEXT,
  tags TEXT[] DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'personal' CHECK (visibility IN ('personal', 'team')),
  is_draft BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Apply updated_at trigger
CREATE TRIGGER memos_set_updated_at
  BEFORE UPDATE ON public.memos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.memos IS 'Personal and team study memos';
COMMENT ON COLUMN public.memos.anchor_id IS 'Material section anchor for context';
COMMENT ON COLUMN public.memos.visibility IS 'personal: author only, team: shared with team';
