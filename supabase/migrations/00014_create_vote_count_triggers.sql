-- Vote count auto-update trigger function
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'question' THEN
      UPDATE public.questions
      SET upvote_count = upvote_count + NEW.value
      WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'answer' THEN
      UPDATE public.answers
      SET upvote_count = upvote_count + NEW.value
      WHERE id = NEW.target_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'question' THEN
      UPDATE public.questions
      SET upvote_count = upvote_count - OLD.value
      WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'answer' THEN
      UPDATE public.answers
      SET upvote_count = upvote_count - OLD.value
      WHERE id = OLD.target_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.target_type = 'question' THEN
      UPDATE public.questions
      SET upvote_count = upvote_count - OLD.value + NEW.value
      WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'answer' THEN
      UPDATE public.answers
      SET upvote_count = upvote_count - OLD.value + NEW.value
      WHERE id = OLD.target_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to votes table
CREATE TRIGGER trigger_update_vote_count
AFTER INSERT OR DELETE OR UPDATE ON public.votes
FOR EACH ROW
EXECUTE FUNCTION update_vote_count();

-- Answer count auto-update trigger function
CREATE OR REPLACE FUNCTION update_answer_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.questions
    SET answer_count = answer_count + 1
    WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.questions
    SET answer_count = answer_count - 1
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to answers table
CREATE TRIGGER trigger_update_answer_count
AFTER INSERT OR DELETE ON public.answers
FOR EACH ROW
EXECUTE FUNCTION update_answer_count();
